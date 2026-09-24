import { AppException } from "@/common/exceptions/app-exception";
import { ReverseProductionOrderUseCase } from "@/modules/production/application/use-cases/reverse-production-order.use-case";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

const PRODUCTION_DATE = new Date("2026-09-23T00:00:00Z");

function orderView(status = ProductionOrderStatus.CONCLUIDA) {
  return {
    idProductionOrder: "po-1",
    idStore: "store-1",
    productionDate: PRODUCTION_DATE,
    status,
  };
}

function movement(
  idProduct: string,
  productName: string,
  type: StockMovementType,
  quantity: number,
  unitCost: number,
) {
  return {
    idProduct,
    productName,
    type,
    quantity,
    unitCost,
    sourceType: "PRODUCTION_ORDER",
    sourceId: "po-1",
  };
}

// Mirrors a real order: shared inputs + one extra per line, two finished
// goods credited.
const LEDGER = [
  movement(
    "leite",
    "Leite Condensado",
    StockMovementType.SAIDA_PRODUCAO,
    1,
    6.79,
  ),
  movement("emb", "Embalagem", StockMovementType.SAIDA_PRODUCAO, 2, 0.8),
  movement("emb", "Embalagem", StockMovementType.SAIDA_PRODUCAO, 2, 0.8),
  movement(
    "mar",
    "Torta Maracujá",
    StockMovementType.ENTRADA_PRODUCAO,
    2,
    4.19135,
  ),
  movement(
    "mor",
    "Torta Morango",
    StockMovementType.ENTRADA_PRODUCAO,
    2,
    4.19135,
  ),
];

function build(overrides?: {
  order?: unknown;
  ledger?: unknown[];
  total?: number;
  stock?: Record<string, { quantityOnHand: number; averageCost: number }>;
  marked?: boolean;
  ledgerFails?: boolean;
}) {
  const ledgerRows = overrides?.ledger ?? LEDGER;
  const stock = overrides?.stock ?? {
    mar: { quantityOnHand: 2, averageCost: 4.19135 },
    mor: { quantityOnHand: 5, averageCost: 3 },
  };
  const orderRepository = {
    findOrderById: jest
      .fn()
      .mockResolvedValue(
        "order" in (overrides ?? {}) ? overrides!.order : orderView(),
      ),
    markOrderReversed: jest.fn().mockResolvedValue(overrides?.marked ?? true),
    undoOrderReversal: jest.fn().mockResolvedValue(undefined),
  };
  const inventoryRepository = {
    listMovements: jest.fn().mockResolvedValue({
      records: ledgerRows,
      total: overrides?.total ?? ledgerRows.length,
    }),
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
  const ledger = {
    registerMovements: overrides?.ledgerFails
      ? jest.fn().mockRejectedValue(new Error("boom"))
      : jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new ReverseProductionOrderUseCase(
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

describe("ReverseProductionOrderUseCase", () => {
  it("returns every input and takes every finished good back out, netted per product", async () => {
    const { useCase, auth, inventoryRepository, orderRepository, ledger } =
      build();

    await useCase.execute("user-1", "store-1", "po-1", "  lançado errado ");

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "COMPLETE_PRODUCTION",
    );
    expect(inventoryRepository.listMovements).toHaveBeenCalledWith(
      "store-1",
      expect.objectContaining({
        sourceId: "po-1",
        sourceType: "PRODUCTION_ORDER",
      }),
    );
    expect(orderRepository.markOrderReversed).toHaveBeenCalledWith(
      expect.objectContaining({
        idProductionOrder: "po-1",
        reversedByUserId: "user-1",
        reversalReason: "lançado errado",
      }),
    );

    const movements = ledger.registerMovements.mock.calls[0][0];
    expect(movements).toHaveLength(4);
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idProduct: "mar",
          type: StockMovementType.ESTORNO_ENTRADA_PRODUCAO,
          quantity: 2,
          unitCost: 4.19135,
        }),
        expect.objectContaining({
          idProduct: "mor",
          type: StockMovementType.ESTORNO_ENTRADA_PRODUCAO,
          quantity: 2,
        }),
        expect.objectContaining({
          idProduct: "leite",
          type: StockMovementType.ESTORNO_SAIDA_PRODUCAO,
          quantity: 1,
          unitCost: 6.79,
        }),
        // Two extra lines of the same packaging collapse into one return.
        expect.objectContaining({
          idProduct: "emb",
          type: StockMovementType.ESTORNO_SAIDA_PRODUCAO,
          quantity: 4,
          unitCost: 0.8,
        }),
      ]),
    );
    for (const entry of movements) {
      expect(entry).toEqual(
        expect.objectContaining({
          sourceType: "PRODUCTION_ORDER_REVERSAL",
          sourceId: "po-1",
          occurredAt: PRODUCTION_DATE,
        }),
      );
    }
  });

  it("skips products whose entries already net to zero", async () => {
    // A product credited by mistake and already corrected by hand against
    // the same order must not be touched again.
    const { useCase, ledger } = build({
      ledger: [
        ...LEDGER,
        movement(
          "lim",
          "Torta Limão",
          StockMovementType.ENTRADA_PRODUCAO,
          2,
          4.19135,
        ),
        movement(
          "lim",
          "Torta Limão",
          StockMovementType.AJUSTE_NEGATIVO,
          2,
          4.19135,
        ),
      ],
    });

    await useCase.execute("user-1", "store-1", "po-1", "motivo");

    const movements = ledger.registerMovements.mock.calls[0][0];
    expect(
      movements.some(
        (entry: { idProduct: string }) => entry.idProduct === "lim",
      ),
    ).toBe(false);
  });

  it("refuses when a finished good is no longer fully on hand", async () => {
    const { useCase, orderRepository, ledger } = build({
      stock: {
        mar: { quantityOnHand: 1, averageCost: 4.19135 },
        mor: { quantityOnHand: 5, averageCost: 3 },
      },
    });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toMatchObject({
      response: { code: "PRODUCTION_REVERSAL_INSUFFICIENT_STOCK" },
    });
    expect(orderRepository.markOrderReversed).not.toHaveBeenCalled();
    expect(ledger.registerMovements).not.toHaveBeenCalled();
  });

  it("requires a reason", async () => {
    const { useCase, orderRepository } = build();

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "   "),
    ).rejects.toMatchObject({
      response: { code: "PRODUCTION_REVERSAL_REASON_REQUIRED" },
    });
    expect(orderRepository.findOrderById).not.toHaveBeenCalled();
  });

  it.each([
    [
      ProductionOrderStatus.RASCUNHO,
      "PRODUCTION_ORDER_CANNOT_REVERSE_NOT_CONCLUDED",
    ],
    [
      ProductionOrderStatus.CANCELADA,
      "PRODUCTION_ORDER_CANNOT_REVERSE_NOT_CONCLUDED",
    ],
    [ProductionOrderStatus.ESTORNADA, "PRODUCTION_ORDER_ALREADY_REVERSED"],
  ])("rejects an order in status %s", async (status, code) => {
    const { useCase, ledger } = build({ order: orderView(status) });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toMatchObject({ response: { code } });
    expect(ledger.registerMovements).not.toHaveBeenCalled();
  });

  it("does not touch stock when a concurrent reversal already flipped the status", async () => {
    const { useCase, ledger } = build({ marked: false });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toMatchObject({
      response: { code: "PRODUCTION_ORDER_ALREADY_REVERSED" },
    });
    expect(ledger.registerMovements).not.toHaveBeenCalled();
  });

  it("puts the order back to CONCLUIDA when the stock batch fails", async () => {
    const { useCase, orderRepository } = build({ ledgerFails: true });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toThrow("boom");
    expect(orderRepository.undoOrderReversal).toHaveBeenCalledWith("po-1");
  });

  it("never reverses from a partial read of the order's ledger", async () => {
    const { useCase, orderRepository } = build({ total: LEDGER.length + 1 });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toThrow();
    expect(orderRepository.markOrderReversed).not.toHaveBeenCalled();
  });

  it("rejects an unknown order", async () => {
    const { useCase } = build({ order: null });

    await expect(
      useCase.execute("user-1", "store-1", "po-1", "motivo"),
    ).rejects.toBeInstanceOf(AppException);
  });
});
