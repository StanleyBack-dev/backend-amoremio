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

    // Check every input has enough on hand and read its current average cost
    // before touching anything — a completed order must never leave stock
    // negative. One batched read instead of one query per item.
    const stockByProduct = await this.inventoryRepository.getCurrentStockBatch(
      idStore,
      order.items.map((item) => item.idProduct),
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

    const calc = ProductionCostCalculatorService.calculate({
      items: priced,
      laborCost: order.laborCost,
      overheadCost: order.overheadCost,
      outputQuantity: order.actualOutputQuantity,
    });
    const lineByRef = new Map(calc.items.map((line) => [line.ref, line]));
    const unitCostByRef = new Map(
      priced.map((line) => [line.ref, line.unitCost]),
    );

    // Freeze costs and status before the stock movements so the order can
    // never be completed twice (assertDraft would fail on a retry), which
    // keeps the additive/subtractive stock entries from applying more than
    // once.
    const completed = await this.orderRepository.completeOrder({
      idProductionOrder,
      inputsCost: calc.inputsCost,
      totalCost: calc.totalCost,
      outputUnitCost: calc.outputUnitCost,
      actualOutputQuantity: order.actualOutputQuantity,
      concludedAt: new Date(),
      items: order.items.map((item) => ({
        idProductionOrderItem: item.idProductionOrderItem,
        unitCostAtConsumption:
          unitCostByRef.get(item.idProductionOrderItem) ?? 0,
        lineCost: lineByRef.get(item.idProductionOrderItem)?.lineCost ?? 0,
      })),
    });

    // Debit every input, then credit the finished product — all in one
    // batched transaction (dozens of round-trips collapse to a handful, which
    // is what kept this call under the request timeout against a cloud DB).
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
        {
          idStore,
          idProduct: order.idOutputProduct,
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: order.actualOutputQuantity,
          unitCost: calc.outputUnitCost,
          sourceType: PRODUCTION_SOURCE,
          sourceId: idProductionOrder,
          note: `Produção ${idProductionOrder}`,
          createdByUserId: userId,
          occurredAt: order.productionDate,
        },
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
