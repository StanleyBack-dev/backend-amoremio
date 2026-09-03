import { AppException } from "@/common/exceptions/app-exception";
import { FinalizePurchaseUseCase } from "@/modules/purchasing/application/use-cases/finalize-purchase.use-case";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function purchaseView(overrides?: Partial<Record<string, unknown>>) {
  return {
    idPurchase: "pur-1",
    idStore: "store-1",
    status: PurchaseStatus.RASCUNHO,
    freightAmount: 10,
    discountAmount: 0,
    purchaseDate: new Date("2026-01-10T00:00:00Z"),
    items: [
      {
        idPurchaseItem: "item-1",
        idProduct: "prod-1",
        productName: "Coca",
        purchasedQuantity: 1,
        conversionFactor: 1,
        unitPrice: 30,
      },
      {
        idPurchaseItem: "item-2",
        idProduct: "prod-2",
        productName: "Guaraná",
        purchasedQuantity: 1,
        conversionFactor: 1,
        unitPrice: 70,
      },
    ],
    ...overrides,
  };
}

function build(overrides?: { purchase?: unknown }) {
  const purchaseRepository = {
    findById: jest
      .fn()
      .mockResolvedValue(
        "purchase" in (overrides ?? {})
          ? overrides!.purchase
          : purchaseView(),
      ),
    finalize: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ ...purchaseView(), status: PurchaseStatus.FINALIZADA, ...payload }),
      ),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  const ledger = { registerMovements: jest.fn().mockResolvedValue(undefined) };

  return {
    useCase: new FinalizePurchaseUseCase(
      purchaseRepository as never,
      auth as never,
      ledger as never,
    ),
    purchaseRepository,
    auth,
    ledger,
  };
}

describe("FinalizePurchaseUseCase", () => {
  it("freezes totals and credits stock with the effective unit cost per item", async () => {
    const { useCase, purchaseRepository, ledger, auth } = build();

    await useCase.execute("user-1", "store-1", "pur-1");

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "FINALIZE_PURCHASE",
    );

    // subtotal 100 + freight 10 = 110
    expect(purchaseRepository.finalize).toHaveBeenCalledWith(
      expect.objectContaining({ itemsSubtotal: 100, total: 110 }),
    );

    expect(ledger.registerMovements).toHaveBeenCalledTimes(1);
    const movements = ledger.registerMovements.mock.calls[0][0];
    expect(movements).toHaveLength(2);
    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idProduct: "prod-1",
          type: StockMovementType.ENTRADA_COMPRA,
          quantity: 1,
          unitCost: 33,
          sourceType: "PURCHASE",
          sourceId: "pur-1",
        }),
        expect.objectContaining({ idProduct: "prod-2", unitCost: 77 }),
      ]),
    );
  });

  it("rejects finalizing a purchase that is not a draft", async () => {
    const { useCase } = build({
      purchase: purchaseView({ status: PurchaseStatus.FINALIZADA }),
    });

    await expect(
      useCase.execute("user-1", "store-1", "pur-1"),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects finalizing an empty purchase", async () => {
    const { useCase } = build({ purchase: purchaseView({ items: [] }) });

    await expect(
      useCase.execute("user-1", "store-1", "pur-1"),
    ).rejects.toBeInstanceOf(AppException);
  });
});
