import { AppException } from "@/common/exceptions/app-exception";
import { CreateProductUseCase } from "@/modules/catalog/application/use-cases/create-product.use-case";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

function build(overrides?: {
  byName?: unknown;
  skuBaseCount?: number;
  takenSkus?: string[];
}) {
  const takenSkus = new Set(overrides?.takenSkus ?? []);
  const productRepository = {
    findByName: jest
      .fn()
      .mockResolvedValue(
        "byName" in (overrides ?? {}) ? overrides!.byName : null,
      ),
    findBySku: jest
      .fn()
      .mockImplementation((_idStore: string, sku: string) =>
        Promise.resolve(takenSkus.has(sku) ? { idProduct: "other" } : null),
      ),
    countBySkuBase: jest.fn().mockResolvedValue(overrides?.skuBaseCount ?? 0),
    create: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idProduct: "p-1", status: true, ...payload }),
      ),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new CreateProductUseCase(
      productRepository as never,
      auth as never,
    ),
    productRepository,
    auth,
  };
}

const cmd = {
  idStore: "store-1",
  name: "Coca 2L",
  kind: ProductKind.REVENDA,
  unit: UnitOfMeasure.UN,
  salePrice: 10,
};

describe("CreateProductUseCase", () => {
  it("checks the store permission and creates the product with a generated sku", async () => {
    const { useCase, productRepository, auth } = build();

    await useCase.execute("user-1", cmd);

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "MANAGE_PRODUCTS",
    );
    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Coca 2L",
        sku: "COCA2L-001",
        kind: ProductKind.REVENDA,
        unit: "UN",
      }),
    );
  });

  it("skips sku suffixes that are already taken", async () => {
    const { useCase, productRepository } = build({
      takenSkus: ["COCA2L-001", "COCA2L-002"],
    });

    await useCase.execute("user-1", cmd);

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "COCA2L-003" }),
    );
  });

  it("rejects a duplicated name", async () => {
    const { useCase } = build({ byName: { idProduct: "other" } });
    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("scopes the duplicate check to the name/brand pair when a brand is given", async () => {
    const { useCase, productRepository } = build();

    await useCase.execute("user-1", { ...cmd, brand: "Itambé" });

    expect(productRepository.findByName).toHaveBeenCalledWith(
      "store-1",
      "Coca 2L",
      "Itambé",
    );
    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Coca 2L", brand: "Itambé" }),
    );
  });

  it("checks the name alone when no brand is given", async () => {
    const { useCase, productRepository } = build();

    await useCase.execute("user-1", cmd);

    expect(productRepository.findByName).toHaveBeenCalledWith(
      "store-1",
      "Coca 2L",
      null,
    );
  });

  it("rejects a duplicated name/brand pair", async () => {
    const { useCase } = build({ byName: { idProduct: "other" } });
    await expect(
      useCase.execute("user-1", { ...cmd, brand: "Itambé" }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
