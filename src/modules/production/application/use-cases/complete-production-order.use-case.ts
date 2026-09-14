import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import {
  PRODUCTION_ORDER_REPOSITORY,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionCostCalculatorService } from "@/modules/production/domain/services/production-cost-calculator.service";
import {
  assertDraft,
  loadProductionOrderOrFail,
} from "@/modules/production/application/use-cases/production-access.helper";

const PRODUCTION_SOURCE = "PRODUCTION_ORDER";

@Injectable()
export class CompleteProductionOrderUseCase {
  private readonly logger = new Logger(CompleteProductionOrderUseCase.name);

  constructor(
    @Inject(PRODUCTION_ORDER_REPOSITORY)
    private readonly orderRepository: ProductionOrderRepositoryPort,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.COMPLETE_PRODUCTION,
    );

    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);

    if (order.items.length === 0) {
      throw AppException.from(APP_ERRORS.production.emptyOrder, undefined);
    }
    // Outputs (and their extras) are added one at a time before this point —
    // see ProductionOrderCrudUseCases.addOutput/addOutputExtra — and already
    // validated there (product exists, right kind, no duplicates). This is
    // just the last check that at least one survived.
    if (order.outputs.length === 0) {
      throw AppException.from(
        APP_ERRORS.production.noOutputsProvided,
        undefined,
      );
    }

    const extraProductIds = [
      ...new Set(
        order.outputs.flatMap((output) =>
          output.extras.map((extra) => extra.idProduct),
        ),
      ),
    ];

    // Check every input (shared batch inputs + every line's extras) has
    // enough on hand and read its current average cost before touching
    // anything — a completed order must never leave stock negative. One
    // batched read instead of one query per item.
    const stockByProduct = await this.inventoryRepository.getCurrentStockBatch(
      idStore,
      [...order.items.map((item) => item.idProduct), ...extraProductIds],
    );
    const priced: { ref: string; quantity: number; unitCost: number }[] = [];
    for (const item of order.items) {
      const stock = stockByProduct.get(item.idProduct);
      const onHand = stock?.quantityOnHand ?? 0;
      if (onHand < item.quantity) {
        throw AppException.from(APP_ERRORS.production.insufficientInput, {
          product: item.productName,
        });
      }
      priced.push({
        ref: item.idProductionOrderItem,
        quantity: item.quantity,
        unitCost: stock?.averageCost ?? 0,
      });
    }

    // Extras are consumed once each, but the same product could appear as an
    // extra on more than one output line — track running consumption so a
    // second line can't "reuse" stock the first line already claimed.
    const extraConsumed = new Map<string, number>();
    const pricedExtrasByOutputIndex = order.outputs.map((output) =>
      output.extras.map((extra) => {
        const stock = stockByProduct.get(extra.idProduct);
        const onHand = stock?.quantityOnHand ?? 0;
        const alreadyConsumed = extraConsumed.get(extra.idProduct) ?? 0;
        if (onHand < alreadyConsumed + extra.quantity) {
          throw AppException.from(APP_ERRORS.production.insufficientInput, {
            product: extra.productName,
          });
        }
        extraConsumed.set(extra.idProduct, alreadyConsumed + extra.quantity);
        const unitCost = stock?.averageCost ?? 0;
        return {
          idProductionOrderOutputExtra: extra.idProductionOrderOutputExtra,
          idProduct: extra.idProduct,
          productName: extra.productName,
          quantity: extra.quantity,
          unitCostAtConsumption: unitCost,
          lineCost: Math.round(extra.quantity * unitCost * 10000) / 10000,
        };
      }),
    );

    const totalOutputQuantity = order.outputs.reduce(
      (sum, output) => sum + output.quantity,
      0,
    );
    const calc = ProductionCostCalculatorService.calculate({
      items: priced,
      laborCost: order.laborCost,
      overheadCost: order.overheadCost,
      outputQuantity: totalOutputQuantity,
    });
    const lineByRef = new Map(calc.items.map((line) => [line.ref, line]));
    const unitCostByRef = new Map(
      priced.map((line) => [line.ref, line.unitCost]),
    );

    // Blended base cost (shared inputs + labor + overhead spread over every
    // unit produced) plus this line's own extras, divided back out to a
    // per-unit cost for that line's stock entry.
    const finalOutputs = order.outputs.map((output, index) => {
      const extras = pricedExtrasByOutputIndex[index];
      const extrasCost = extras.reduce((sum, extra) => sum + extra.lineCost, 0);
      const lineTotalCost =
        Math.round(
          (output.quantity * calc.outputUnitCost + extrasCost) * 10000,
        ) / 10000;
      const unitCost =
        Math.round((lineTotalCost / output.quantity) * 1e6) / 1e6;
      return {
        idProductionOrderOutput: output.idProductionOrderOutput,
        idProduct: output.idProduct,
        productName: output.productName,
        quantity: output.quantity,
        unitCost,
        extras,
      };
    });
    const totalExtrasCost = finalOutputs.reduce(
      (sum, output) =>
        sum + output.extras.reduce((s, extra) => s + extra.lineCost, 0),
      0,
    );

    // Freeze costs and status before the stock movements so the order can
    // never be completed twice (assertDraft would fail on a retry), which
    // keeps the additive/subtractive stock entries from applying more than
    // once.
    const completed = await this.orderRepository.completeOrder({
      idProductionOrder,
      inputsCost: calc.inputsCost,
      totalCost: Math.round((calc.totalCost + totalExtrasCost) * 10000) / 10000,
      outputUnitCost: calc.outputUnitCost,
      actualOutputQuantity: totalOutputQuantity,
      concludedAt: new Date(),
      items: order.items.map((item) => ({
        idProductionOrderItem: item.idProductionOrderItem,
        unitCostAtConsumption:
          unitCostByRef.get(item.idProductionOrderItem) ?? 0,
        lineCost: lineByRef.get(item.idProductionOrderItem)?.lineCost ?? 0,
      })),
      outputs: finalOutputs,
    });

    // Debit every shared input and every line's extras, then credit every
    // finished-good line — all in one batched transaction (dozens of
    // round-trips collapse to a handful, which is what kept this call under
    // the request timeout against a cloud DB).
    try {
      await this.inventoryLedgerService.registerMovements([
        ...order.items.map((item) => ({
          idStore,
          idProduct: item.idProduct,
          type: StockMovementType.SAIDA_PRODUCAO,
          quantity: item.quantity,
          sourceType: PRODUCTION_SOURCE,
          sourceId: idProductionOrder,
          note: `Produção ${idProductionOrder}`,
          createdByUserId: userId,
          occurredAt: order.productionDate,
        })),
        ...finalOutputs.flatMap((output) =>
          output.extras.map((extra) => ({
            idStore,
            idProduct: extra.idProduct,
            type: StockMovementType.SAIDA_PRODUCAO,
            quantity: extra.quantity,
            sourceType: PRODUCTION_SOURCE,
            sourceId: idProductionOrder,
            note: `Produção ${idProductionOrder} (extra de ${output.productName})`,
            createdByUserId: userId,
            occurredAt: order.productionDate,
          })),
        ),
        ...finalOutputs.map((output) => ({
          idStore,
          idProduct: output.idProduct,
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: output.quantity,
          unitCost: output.unitCost,
          sourceType: PRODUCTION_SOURCE,
          sourceId: idProductionOrder,
          note: `Produção ${idProductionOrder}`,
          createdByUserId: userId,
          occurredAt: order.productionDate,
        })),
      ]);
    } catch (error) {
      // The order stays CONCLUIDA with its costs frozen; the stock entries
      // did not apply (the batch is atomic). Surfaced for a manual fix.
      this.logger.error(
        `Falha ao movimentar estoque da produção ${idProductionOrder}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }

    return completed;
  }
}
