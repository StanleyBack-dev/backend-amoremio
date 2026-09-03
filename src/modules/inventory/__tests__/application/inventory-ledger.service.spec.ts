import { AppException } from "@/common/exceptions/app-exception";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function build(overrides?: {
  product?: unknown;
  currentStock?: unknown;
  stockById?: Record<string, { quantityOnHand: number; averageCost: number }>;
}) {
  const productRepository = {
    findById: jest
      .fn()
      .mockResolvedValue(
        "product" in (overrides ?? {})
          ? overrides!.product
          : { idProduct: "p-1", idStore: "s-1" },
      ),
  };
  const currentStock =
    "currentStock" in (overrides ?? {}) ? overrides!.currentStock : null;
  const inventoryRepository = {
    getCurrentStock: jest.fn().mockResolvedValue(currentStock),
    getCurrentStockBatch: jest
      .fn()
      .mockImplementation((_store: string, ids: string[]) => {
        const map = new Map<string, unknown>();
        for (const id of ids) {
          if (overrides?.stockById?.[id]) {
            map.set(id, overrides.stockById[id]);
          } else if (!overrides?.stockById && currentStock) {
            map.set(id, currentStock);
          }
        }
        return Promise.resolve(map);
      }),
    findExistingProductIds: jest
      .fn()
      .mockImplementation((_store: string, ids: string[]) =>
        Promise.resolve(new Set(ids)),
      ),
    persistMovement: jest.fn().mockResolvedValue(undefined),
    persistMovementsBatch: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new InventoryLedgerService(
      productRepository as never,
      inventoryRepository as never,
    ),
    inventoryRepository,
  };
}

describe("InventoryLedgerService.registerMovement", () => {
  it("rejects a movement for a product outside the store", async () => {
    const { service } = build({ product: null });

    await expect(
      service.registerMovement({
        idStore: "s-1",
        idProduct: "ghost",
        type: StockMovementType.AJUSTE_POSITIVO,
        quantity: 1,
        unitCost: 2,
        createdByUserId: "u-1",
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("persists the resulting snapshot for a first-ever entry", async () => {
    const { service, inventoryRepository } = build();

    await service.registerMovement({
      idStore: "s-1",
      idProduct: "p-1",
      type: StockMovementType.ENTRADA_COMPRA,
      quantity: 4,
      unitCost: 5,
      createdByUserId: "u-1",
    });

    expect(inventoryRepository.persistMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        resultingQuantity: 4,
        resultingAverageCost: 5,
        unitCost: 5,
      }),
    );
  });

  it("falls back to the current average cost for a positive adjustment without a cost", async () => {
    const { service, inventoryRepository } = build({
      currentStock: { quantityOnHand: 10, averageCost: 3 },
    });

    await service.registerMovement({
      idStore: "s-1",
      idProduct: "p-1",
      type: StockMovementType.AJUSTE_POSITIVO,
      quantity: 2,
      createdByUserId: "u-1",
    });

    expect(inventoryRepository.persistMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        resultingQuantity: 12,
        resultingAverageCost: 3,
        unitCost: 3,
      }),
    );
  });
});

describe("InventoryLedgerService.registerMovements", () => {
  it("computes each movement against the running in-memory state and persists them in one batch", async () => {
    const { service, inventoryRepository } = build({
      stockById: { "in-1": { quantityOnHand: 100, averageCost: 2 } },
    });

    await service.registerMovements([
      {
        idStore: "s-1",
        idProduct: "in-1",
        type: StockMovementType.SAIDA_PRODUCAO,
        quantity: 10,
        createdByUserId: "u-1",
      },
      {
        idStore: "s-1",
        idProduct: "out-1",
        type: StockMovementType.ENTRADA_PRODUCAO,
        quantity: 5,
        unitCost: 7,
        createdByUserId: "u-1",
      },
    ]);

    expect(inventoryRepository.persistMovement).not.toHaveBeenCalled();
    expect(inventoryRepository.persistMovementsBatch).toHaveBeenCalledTimes(1);
    const rows = inventoryRepository.persistMovementsBatch.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    // outbound leaves the average untouched, only reduces quantity
    expect(rows[0]).toEqual(
      expect.objectContaining({
        idProduct: "in-1",
        resultingQuantity: 90,
        resultingAverageCost: 2,
      }),
    );
    // first-ever entry for the finished good
    expect(rows[1]).toEqual(
      expect.objectContaining({
        idProduct: "out-1",
        resultingQuantity: 5,
        resultingAverageCost: 7,
        unitCost: 7,
      }),
    );
  });

  it("rejects the whole batch when a product does not belong to the store", async () => {
    const { service, inventoryRepository } = build();
    inventoryRepository.findExistingProductIds.mockResolvedValueOnce(new Set());

    await expect(
      service.registerMovements([
        {
          idStore: "s-1",
          idProduct: "ghost",
          type: StockMovementType.SAIDA_PRODUCAO,
          quantity: 1,
          createdByUserId: "u-1",
        },
      ]),
    ).rejects.toBeInstanceOf(AppException);
    expect(inventoryRepository.persistMovementsBatch).not.toHaveBeenCalled();
  });
});
