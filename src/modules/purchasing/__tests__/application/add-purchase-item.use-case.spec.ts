import { AppException } from "@/common/exceptions/app-exception";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { AddPurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/add-purchase-item.use-case";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

function build(overrides?: { purchase?: unknown; product?: unknown }) {
  const purchaseRepository = {
    findById: jest
      .fn()
      .mockResolvedValue(
        "purchase" in (overrides ?? {})
          ? overrides!.purchase
          : { idPurchase: "pur-1", status: PurchaseStatus.RASCUNHO, items: [] },
      ),
    addItem: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idPurchase: "pur-1", items: [payload] }),
      ),
  };
  const productRepository = {
    findById: jest.fn().mockResolvedValue(
      "product" in (overrides ?? {})
        ? overrides!.product
        : {
            idProduct: "prod-1",
            name: "Coca",
            unit: "UN",
            kind: ProductKind.REVENDA,
          },
    ),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new AddPurchaseItemUseCase(
      purchaseRepository as never,
      productRepository as never,
      auth as never,
    ),
    purchaseRepository,
  };
}

const cmd = {
  idStore: "store-1",
  idPurchase: "pur-1",
  idProduct: "prod-1",
  purchasedQuantity: 2,
  purchasedUnit: "CX",
  conversionFactor: 6,
  unitPrice: 15,
};

describe("AddPurchaseItemUseCase", () => {
  it("snapshots the product name and stores the computed line total", async () => {
    const { useCase, purchaseRepository } = build();

    await useCase.execute("user-1", cmd);

    expect(purchaseRepository.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "Coca",
        purchasedUnit: "CX",
        lineTotal: 30,
      }),
    );
  });

  it("rejects a product that is not in the store", async () => {
    const { useCase } = build({ product: null });

    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects a product that is not purchasable (a finished good)", async () => {
    const { useCase } = build({
      product: {
        idProduct: "prod-1",
        name: "Bolo",
        unit: "UN",
        kind: ProductKind.PRODUTO_FINAL,
      },
    });

    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects a product already on the purchase", async () => {
    const { useCase, purchaseRepository } = build({
      purchase: {
        idPurchase: "pur-1",
        status: PurchaseStatus.RASCUNHO,
        items: [{ idProduct: "prod-1" }],
      },
    });

    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
    expect(purchaseRepository.addItem).not.toHaveBeenCalled();
  });

  it("rejects adding an item to a non-draft purchase", async () => {
    const { useCase } = build({
      purchase: {
        idPurchase: "pur-1",
        status: PurchaseStatus.FINALIZADA,
        items: [],
      },
    });

    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });
});
