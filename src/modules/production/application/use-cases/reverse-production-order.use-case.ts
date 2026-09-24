import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type StockMovementView,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import {
  InventoryLedgerService,
  type RegisterMovementInput,
} from "@/modules/inventory/application/services/inventory-ledger.service";
import {
  STOCK_INBOUND_TYPES,
  StockMovementType,
} from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import {
  PRODUCTION_ORDER_REPOSITORY,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import { loadProductionOrderOrFail } from "@/modules/production/application/use-cases/production-access.helper";

// Must match CompleteProductionOrderUseCase — the movements it wrote are the
// ones being undone.
const PRODUCTION_SOURCE = "PRODUCTION_ORDER";
const REVERSAL_SOURCE = "PRODUCTION_ORDER_REVERSAL";
// A single order touches a handful of products; this is only a ceiling for
// the one-page read of its ledger entries.
const MAX_ORDER_MOVEMENTS = 1000;
const MAX_NOTE_LENGTH = 255;
const QUANTITY_EPSILON = 0.0005;

type NetMovement = {
  idProduct: string;
  productName: string;
  // > 0: the order credited this product (finished good); < 0: it debited it
  // (input / extra).
  quantity: number;
  value: number;
};

// Undoes a completed production order: returns every input it consumed and
// takes back out every finished good it credited, then marks it ESTORNADA.
//
// The reversal is derived from the order's actual ledger entries (source
// PRODUCTION_ORDER + its id), not from its item/output rows — so it undoes
// exactly what hit stock, including the case where completion froze the
// costs but the stock batch failed (nothing to undo) and any later
// corrections filed against the same order. Entries are netted per product.
@Injectable()
export class ReverseProductionOrderUseCase {
  private readonly logger = new Logger(ReverseProductionOrderUseCase.name);

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
    reason: string,
  ): Promise<ProductionOrderView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.COMPLETE_PRODUCTION,
    );

    const reversalReason = reason?.trim() ?? "";
    if (!reversalReason) {
      throw AppException.from(
        APP_ERRORS.production.reversalReasonRequired,
        undefined,
      );
    }

    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    this.assertReversible(order);

    const net = await this.loadNetMovements(idStore, idProductionOrder);
    const produced = net.filter((line) => line.quantity > 0);
    const consumed = net.filter((line) => line.quantity < 0);

    // Everything the order produced must still be on hand — if part of it
    // was already sold or written off, taking it back out would drive stock
    // negative. Checked up front so the user gets the product name instead
    // of a generic ledger error.
    if (produced.length > 0) {
      const stock = await this.inventoryRepository.getCurrentStockBatch(
        idStore,
        produced.map((line) => line.idProduct),
      );
      for (const line of produced) {
        const onHand = stock.get(line.idProduct)?.quantityOnHand ?? 0;
        if (onHand + QUANTITY_EPSILON < line.quantity) {
          throw AppException.from(
            APP_ERRORS.production.reversalInsufficientStock,
            { product: line.productName },
          );
        }
      }
    }

    const note =
      `Estorno da produção ${idProductionOrder}: ${reversalReason}`.slice(
        0,
        MAX_NOTE_LENGTH,
      );
    const base = {
      idStore,
      sourceType: REVERSAL_SOURCE,
      sourceId: idProductionOrder,
      note,
      createdByUserId: userId,
      // Same date the production was booked on, so period reports (cost of
      // production, top inputs) net it out in the same period.
      occurredAt: order.productionDate,
    };
    const movements: RegisterMovementInput[] = [
      ...produced.map((line) => ({
        ...base,
        idProduct: line.idProduct,
        type: StockMovementType.ESTORNO_ENTRADA_PRODUCAO,
        quantity: line.quantity,
        unitCost: unitCostOf(line),
      })),
      ...consumed.map((line) => ({
        ...base,
        idProduct: line.idProduct,
        type: StockMovementType.ESTORNO_SAIDA_PRODUCAO,
        quantity: -line.quantity,
        unitCost: unitCostOf(line),
      })),
    ];

    // Flip the status first, conditionally (CONCLUIDA -> ESTORNADA): a
    // concurrent second reversal loses here and never touches stock.
    const marked = await this.orderRepository.markOrderReversed({
      idProductionOrder,
      reversedAt: new Date(),
      reversedByUserId: userId,
      reversalReason,
    });
    if (!marked) {
      throw AppException.from(APP_ERRORS.production.alreadyReversed, undefined);
    }

    try {
      // One atomic batch — either every entry is undone or none is.
      await this.inventoryLedgerService.registerMovements(movements);
    } catch (error) {
      // Stock is untouched (the batch is atomic); put the order back so it
      // can be retried.
      this.logger.error(
        `Falha ao estornar estoque da produção ${idProductionOrder}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
      await this.orderRepository.undoOrderReversal(idProductionOrder);
      throw error;
    }

    return loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
  }

  private assertReversible(order: ProductionOrderView): void {
    if (order.status === ProductionOrderStatus.ESTORNADA) {
      throw AppException.from(APP_ERRORS.production.alreadyReversed, undefined);
    }
    if (order.status !== ProductionOrderStatus.CONCLUIDA) {
      throw AppException.from(
        APP_ERRORS.production.cannotReverseNotConcluded,
        undefined,
      );
    }
  }

  private async loadNetMovements(
    idStore: string,
    idProductionOrder: string,
  ): Promise<NetMovement[]> {
    const { records, total } = await this.inventoryRepository.listMovements(
      idStore,
      {
        sourceId: idProductionOrder,
        sourceType: PRODUCTION_SOURCE,
        limit: MAX_ORDER_MOVEMENTS,
      },
    );
    if (total > records.length) {
      // Never reverse from a partial read.
      throw new Error(
        `Produção ${idProductionOrder} tem ${total} movimentações; limite de estorno é ${MAX_ORDER_MOVEMENTS}.`,
      );
    }

    const byProduct = new Map<string, NetMovement>();
    for (const movement of records) {
      const line = byProduct.get(movement.idProduct) ?? {
        idProduct: movement.idProduct,
        productName: movement.productName,
        quantity: 0,
        value: 0,
      };
      const sign = signOf(movement);
      line.quantity += sign * movement.quantity;
      line.value += sign * movement.quantity * movement.unitCost;
      byProduct.set(movement.idProduct, line);
    }

    return [...byProduct.values()]
      .map((line) => ({
        ...line,
        quantity: Math.round(line.quantity * 1000) / 1000,
      }))
      .filter((line) => Math.abs(line.quantity) >= QUANTITY_EPSILON);
  }
}

function signOf(movement: StockMovementView): 1 | -1 {
  return STOCK_INBOUND_TYPES.includes(movement.type) ? 1 : -1;
}

// Net value ÷ net quantity is the cost the entries came in / went out at. A
// negative figure would only come from an inconsistent history — never feed
// that to the ledger.
function unitCostOf(line: NetMovement): number {
  return Math.max(0, line.value / line.quantity);
}
