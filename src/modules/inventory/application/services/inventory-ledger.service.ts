import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UnitCost } from "@/shared/domain/value-objects/unit-cost.vo";
import { Quantity } from "@/shared/domain/value-objects/quantity.vo";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type PersistStockMovementInput,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import {
  STOCK_INBOUND_TYPES,
  StockMovementType,
} from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import { StockLedgerService } from "@/modules/inventory/domain/services/stock-ledger.service";

export interface RegisterMovementInput {
  idStore: string;
  idProduct: string;
  type: StockMovementType;
  quantity: number;
  // Required for inbound movements. If omitted on an AJUSTE_POSITIVO the
  // current average cost is used.
  unitCost?: number;
  sourceType?: string | null;
  sourceId?: string | null;
  note?: string | null;
  createdByUserId: string;
  occurredAt?: Date;
}

// Application-layer engine that every stock change goes through: manual
// adjustments (AdjustStockUseCase) and, later, purchase entries and sale
// exits from the purchasing/sales contexts. Validates the product belongs
// to the store, runs the pure StockLedgerService calculation and persists
// the new snapshot + the movement row atomically. Does not authorize —
// the calling use case is responsible for that.
@Injectable()
export class InventoryLedgerService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async registerMovement(input: RegisterMovementInput): Promise<void> {
    const product = await this.productRepository.findById(
      input.idStore,
      input.idProduct,
    );
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    const current = (await this.inventoryRepository.getCurrentStock(
      input.idStore,
      input.idProduct,
    )) ?? { quantityOnHand: 0, averageCost: 0 };

    const isInbound = STOCK_INBOUND_TYPES.includes(input.type);
    // Inbound: the cost being brought in (drives the weighted average).
    // Outbound: the average cost at the time it leaves, recorded on the
    // movement so downstream reporting (COGS) can read it back without
    // re-deriving it. It does not affect the stored average either way.
    const unitCost = isInbound
      ? UnitCost.fromNumber(input.unitCost ?? current.averageCost)
      : UnitCost.fromNumber(current.averageCost);

    const result = StockLedgerService.apply(
      {
        quantity: Quantity.fromNumber(current.quantityOnHand),
        averageCost: UnitCost.fromNumber(current.averageCost),
      },
      {
        type: input.type,
        quantity: Quantity.fromNumber(input.quantity),
        unitCost,
      },
    );

    await this.inventoryRepository.persistMovement({
      idStore: input.idStore,
      idProduct: input.idProduct,
      type: input.type,
      quantity: Quantity.fromNumber(input.quantity).toNumber(),
      unitCost: unitCost.toNumber(),
      resultingQuantity: result.quantity.toNumber(),
      resultingAverageCost: result.averageCost.toNumber(),
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      note: input.note ?? null,
      createdByUserId: input.createdByUserId,
      occurredAt: input.occurredAt ?? new Date(),
    });
  }

  // Batch version of registerMovement for the bulk operations (finalize a
  // purchase, complete a production order). All movements are validated and
  // computed up front against in-memory state, then persisted in one
  // transaction — this turns dozens of sequential round-trips to the database
  // into a handful, which matters a lot against a remote (cloud) database.
  // Every input must target the same store. Movements are applied in the
  // given order; when the same product appears twice, the second sees the
  // effect of the first.
  async registerMovements(inputs: RegisterMovementInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const idStore = inputs[0].idStore;
    const productIds = [...new Set(inputs.map((input) => input.idProduct))];

    const [existingProductIds, stockByProduct] = await Promise.all([
      this.inventoryRepository.findExistingProductIds(idStore, productIds),
      this.inventoryRepository.getCurrentStockBatch(idStore, productIds),
    ]);

    for (const idProduct of productIds) {
      if (!existingProductIds.has(idProduct)) {
        throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
      }
    }

    // Mutable running state per product, seeded from the current snapshot.
    const state = new Map<string, { quantity: number; averageCost: number }>();
    for (const idProduct of productIds) {
      const current = stockByProduct.get(idProduct) ?? {
        quantityOnHand: 0,
        averageCost: 0,
      };
      state.set(idProduct, {
        quantity: current.quantityOnHand,
        averageCost: current.averageCost,
      });
    }

    const rows: PersistStockMovementInput[] = inputs.map((input) => {
      const current = state.get(input.idProduct)!;
      const isInbound = STOCK_INBOUND_TYPES.includes(input.type);
      const unitCost = isInbound
        ? UnitCost.fromNumber(input.unitCost ?? current.averageCost)
        : UnitCost.fromNumber(current.averageCost);

      const result = StockLedgerService.apply(
        {
          quantity: Quantity.fromNumber(current.quantity),
          averageCost: UnitCost.fromNumber(current.averageCost),
        },
        {
          type: input.type,
          quantity: Quantity.fromNumber(input.quantity),
          unitCost,
        },
      );

      current.quantity = result.quantity.toNumber();
      current.averageCost = result.averageCost.toNumber();

      return {
        idStore: input.idStore,
        idProduct: input.idProduct,
        type: input.type,
        quantity: Quantity.fromNumber(input.quantity).toNumber(),
        unitCost: unitCost.toNumber(),
        resultingQuantity: result.quantity.toNumber(),
        resultingAverageCost: result.averageCost.toNumber(),
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        note: input.note ?? null,
        createdByUserId: input.createdByUserId,
        occurredAt: input.occurredAt ?? new Date(),
      };
    });

    await this.inventoryRepository.persistMovementsBatch(rows);
  }
}
