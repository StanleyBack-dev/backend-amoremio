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
    // Outputs/extras are already persisted (added one at a time before
    // completion — see ProductionOrderCrudUseCases) by the time this use
    // case runs, so the view already carries them with 0 cost.
    outputs: [
      {
        idProductionOrderOutput: "poo-1",
        idProduct: "out-1",
        productName: "Brownie",
        quantity: 40,
        unitCost: 0,
        extras: [],
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

  it("rejects completion when no outputs were added", async () => {
    const { useCase } = build({ order: orderView({ outputs: [] }) });
    await expect(
      useCase.execute("user-1", "store-1", "po-1"),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("splits one batch into multiple output lines, blending the base cost and pricing each line's own extras separately", async () => {
    const { useCase, orderRepository, ledger } = build({
      stock: {
        "in-1": { quantityOnHand: 10, averageCost: 4 },
        "in-2": { quantityOnHand: 10, averageCost: 20 },
        nutella: { quantityOnHand: 5, averageCost: 10 },
      },
      order: orderView({
        outputs: [
          {
            idProductionOrderOutput: "poo-1",
            idProduct: "out-1",
            productName: "Brownie",
            quantity: 20,
            unitCost: 0,
            extras: [],
          },
          {
            idProductionOrderOutput: "poo-2",
            idProduct: "out-2",
            productName: "Brownie com Nutella",
            quantity: 20,
            unitCost: 0,
            extras: [
              {
                idProductionOrderOutputExtra: "pooe-1",
                idProduct: "nutella",
                productName: "Nutella",
                quantity: 1,
                unitCostAtConsumption: 0,
                lineCost: 0,
              },
            ],
          },
        ],
      }),
    });

    // inputs cost: 1*4 + 2*20 = 44, spread over 40 total units => 1.1/un.
    // out-2 also gets 1 unit of nutella (10) added on top, for its own
    // 20 units => extra 0.5/un on top of the 1.1 blended base.
    await useCase.execute("user-1", "store-1", "po-1");

    expect(orderRepository.completeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        inputsCost: 44,
        totalCost: 54, // 44 (shared) + 10 (nutella extra)
        outputUnitCost: 1.1, // blended base, before extras
        actualOutputQuantity: 40,
        outputs: [
          expect.objectContaining({
            idProduct: "out-1",
            quantity: 20,
            unitCost: 1.1,
            extras: [],
          }),
          expect.objectContaining({
            idProduct: "out-2",
            quantity: 20,
            unitCost: 1.6, // (20*1.1 + 10) / 20
            extras: [
              expect.objectContaining({
                idProduct: "nutella",
                quantity: 1,
                lineCost: 10,
              }),
            ],
          }),
        ],
      }),
    );

    const movements = ledger.registerMovements.mock.calls[0][0];
    expect(movements).toHaveLength(5); // 2 shared inputs + 1 extra + 2 outputs
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idProduct: "nutella",
          type: StockMovementType.SAIDA_PRODUCAO,
          quantity: 1,
        }),
        expect.objectContaining({
          idProduct: "out-1",
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: 20,
          unitCost: 1.1,
        }),
        expect.objectContaining({
          idProduct: "out-2",
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: 20,
          unitCost: 1.6,
        }),
      ]),
    );
  });
});
