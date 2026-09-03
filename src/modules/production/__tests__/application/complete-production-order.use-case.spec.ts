import { AppException } from "@/common/exceptions/app-exception";
import { CompleteProductionOrderUseCase } from "@/modules/production/application/use-cases/complete-production-order.use-case";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function orderView(overrides?: Partial<Record<string, unknown>>) {
  return {
    idProductionOrder: "po-1",
    idStore: "store-1",
    idRecipe: "rec-1",
    recipeName: "Brownie",
    idOutputProduct: "out-1",
    outputProductName: "Brownie",
    productionDate: new Date("2026-02-01T00:00:00Z"),
    status: ProductionOrderStatus.RASCUNHO,
    batches: 2,
    plannedOutputQuantity: 40,
    actualOutputQuantity: 40,
    laborCost: 0,
    overheadCost: 0,
    items: [
      {
        idProductionOrderItem: "poi-1",
        idProduct: "in-1",
        productName: "Farinha",
        quantity: 1,
        unit: "KG",
      },
      {
        idProductionOrderItem: "poi-2",
        idProduct: "in-2",
        productName: "Chocolate",
        quantity: 2,
        unit: "KG",
      },
    ],
    ...overrides,
  };
}

function build(overrides?: {
  order?: unknown;
  stock?: Record<string, { quantityOnHand: number; averageCost: number }>;
}) {
  const stock = overrides?.stock ?? {
    "in-1": { quantityOnHand: 10, averageCost: 4 },
    "in-2": { quantityOnHand: 10, averageCost: 20 },
  };
  const orderRepository = {
    findOrderById: jest
      .fn()
      .mockResolvedValue(
        "order" in (overrides ?? {}) ? overrides!.order : orderView(),
      ),
    completeOrder: jest.fn().mockImplementation((payload) =>
      Promise.resolve({
        ...orderView(),
        status: ProductionOrderStatus.CONCLUIDA,
        ...payload,
      }),
    ),
  };
  const inventoryRepository = {
    getCurrentStock: jest
      .fn()
      .mockImplementation((_store: string, id: string) =>
        Promise.resolve(stock[id] ?? null),
      ),
    getCurrentStockBatch: jest
      .fn()
      .mockImplementation((_store: string, ids: string[]) => {
        const map = new Map<
          string,
          { quantityOnHand: number; averageCost: number }
        >();
        for (const id of ids) {
          if (stock[id]) map.set(id, stock[id]);
        }
        return Promise.resolve(map);
      }),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  const ledger = { registerMovements: jest.fn().mockResolvedValue(undefined) };

  return {
    useCase: new CompleteProductionOrderUseCase(
      orderRepository as never,
      inventoryRepository as never,
      auth as never,
      ledger as never,
    ),
    orderRepository,
    inventoryRepository,
    auth,
    ledger,
  };
}

describe("CompleteProductionOrderUseCase", () => {
  it("debits each input and credits the finished good at the computed unit cost", async () => {
    const { useCase, orderRepository, ledger, auth } = build();

    await useCase.execute("user-1", "store-1", "po-1");

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "COMPLETE_PRODUCTION",
    );

    // inputs cost: 1*4 + 2*20 = 44 ; output 40 => unit cost 1.1
    expect(orderRepository.completeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        inputsCost: 44,
        totalCost: 44,
        outputUnitCost: 1.1,
      }),
    );

    expect(ledger.registerMovements).toHaveBeenCalledTimes(1);
    const movements = ledger.registerMovements.mock.calls[0][0];
    expect(movements).toHaveLength(3);
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idProduct: "in-1",
          type: StockMovementType.SAIDA_PRODUCAO,
          quantity: 1,
          sourceType: "PRODUCTION_ORDER",
          sourceId: "po-1",
        }),
        expect.objectContaining({
          idProduct: "out-1",
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: 40,
          unitCost: 1.1,
        }),
      ]),
    );
  });

  it("rejects completion when an input has insufficient stock — before moving anything", async () => {
    const { useCase, ledger } = build({
      stock: {
        "in-1": { quantityOnHand: 0.5, averageCost: 4 },
        "in-2": { quantityOnHand: 10, averageCost: 20 },
      },
    });

    await expect(
      useCase.execute("user-1", "store-1", "po-1"),
    ).rejects.toBeInstanceOf(AppException);
    expect(ledger.registerMovements).not.toHaveBeenCalled();
  });

  it("rejects completing an order that is not a draft", async () => {
    const { useCase } = build({
      order: orderView({ status: ProductionOrderStatus.CONCLUIDA }),
    });
    await expect(
      useCase.execute("user-1", "store-1", "po-1"),
    ).rejects.toBeInstanceOf(AppException);
  });
});
