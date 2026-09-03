import { AppException } from "@/common/exceptions/app-exception";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { ConfirmSalesOrderUseCase } from "@/modules/sales/application/use-cases/confirm-sales-order.use-case";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function orderView(overrides?: Partial<Record<string, unknown>>) {
  return {
    idSalesOrder: "so-1",
    idStore: "store-1",
    status: SalesOrderStatus.ABERTA,
    discountAmount: 0,
    commissionPercent: 0,
    orderDate: new Date("2026-02-01T00:00:00Z"),
    items: [
      {
        idSalesOrderItem: "i-1",
        idProduct: "p-1",
        productName: "Coca",
        productKind: ProductKind.REVENDA,
        quantity: 3,
        unitPrice: 8,
      },
    ],
    ...overrides,
  };
}

function build(overrides?: { order?: unknown; stock?: unknown }) {
  const salesOrderRepository = {
    findById: jest
      .fn()
      .mockResolvedValue(
        "order" in (overrides ?? {}) ? overrides!.order : orderView(),
      ),
    confirm: jest.fn().mockImplementation((payload) =>
      Promise.resolve({
        ...orderView(),
        status: SalesOrderStatus.CONFIRMADA,
        ...payload,
      }),
    ),
  };
  const stock =
    "stock" in (overrides ?? {})
      ? overrides!.stock
      : { quantityOnHand: 10, averageCost: 4 };
  const inventoryRepository = {
    getCurrentStock: jest.fn().mockResolvedValue(stock),
    getCurrentStockBatch: jest
      .fn()
      .mockImplementation((_store: string, ids: string[]) => {
        const map = new Map<string, unknown>();
        for (const id of ids) if (stock) map.set(id, stock);
        return Promise.resolve(map);
      }),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  const ledger = { registerMovements: jest.fn().mockResolvedValue(undefined) };

  return {
    useCase: new ConfirmSalesOrderUseCase(
      salesOrderRepository as never,
      inventoryRepository as never,
      auth as never,
      ledger as never,
    ),
    salesOrderRepository,
    ledger,
    auth,
  };
}

describe("ConfirmSalesOrderUseCase", () => {
  it("freezes totals and debits stock per item", async () => {
    const { useCase, salesOrderRepository, ledger, auth } = build();

    await useCase.execute("user-1", "store-1", "so-1");

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "CONFIRM_SALE",
    );
    expect(salesOrderRepository.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ itemsSubtotal: 24, total: 24 }),
    );
    expect(ledger.registerMovements).toHaveBeenCalledWith([
      expect.objectContaining({
        idProduct: "p-1",
        type: StockMovementType.SAIDA_VENDA,
        quantity: 3,
        sourceType: "SALES_ORDER",
      }),
    ]);
  });

  it("rejects confirmation when a line has more quantity than stock on hand", async () => {
    const { useCase, ledger } = build({
      stock: { quantityOnHand: 1, averageCost: 4 },
    });

    await expect(
      useCase.execute("user-1", "store-1", "so-1"),
    ).rejects.toBeInstanceOf(AppException);
    expect(ledger.registerMovements).not.toHaveBeenCalled();
  });

  it("debits stock for a finished-good order (fed by production)", async () => {
    const { useCase, salesOrderRepository, ledger } = build({
      order: orderView({
        items: [
          {
            idSalesOrderItem: "i-1",
            idProduct: "p-1",
            productName: "Bolo",
            productKind: ProductKind.PRODUTO_FINAL,
            quantity: 3,
            unitPrice: 8,
          },
        ],
      }),
    });

    await useCase.execute("user-1", "store-1", "so-1");

    expect(salesOrderRepository.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ itemsSubtotal: 24, total: 24 }),
    );
    expect(ledger.registerMovements).toHaveBeenCalledWith([
      expect.objectContaining({
        idProduct: "p-1",
        type: StockMovementType.SAIDA_VENDA,
        quantity: 3,
      }),
    ]);
  });

  it("rejects confirming an order that is not open", async () => {
    const { useCase } = build({
      order: orderView({ status: SalesOrderStatus.CONFIRMADA }),
    });

    await expect(
      useCase.execute("user-1", "store-1", "so-1"),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects confirming an empty order", async () => {
    const { useCase } = build({ order: orderView({ items: [] }) });

    await expect(
      useCase.execute("user-1", "store-1", "so-1"),
    ).rejects.toBeInstanceOf(AppException);
  });
});
