import { AppException } from "@/common/exceptions/app-exception";
import {
  Product,
  buildSkuBase,
} from "@/modules/catalog/domain/entities/product.entity";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

describe("Product.create", () => {
  const base = {
    idStore: "store-1",
    name: "  Coca-Cola 2L  ",
    kind: ProductKind.REVENDA,
    unit: UnitOfMeasure.UN,
    createdByUserId: "user-1",
  };

  it("normalizes name, uppercases sku and rounds sale price", () => {
    const product = Product.create({
      ...base,
      sku: " cc-2l ",
      description: "  refri  ",
      salePrice: 9.999,
    });

    expect(product.toPrimitive()).toEqual({
      idStore: "store-1",
      name: "Coca-Cola 2L",
      sku: "CC-2L",
      description: "refri",
      brand: null,
      kind: ProductKind.REVENDA,
      unit: UnitOfMeasure.UN,
      packagingUnit: PackagingUnit.UNIDADE,
      packSize: 1,
      salePrice: 10,
      createdByUserId: "user-1",
    });
  });

  it("keeps sku and salePrice null when omitted", () => {
    const primitive = Product.create(base).toPrimitive();
    expect(primitive.sku).toBeNull();
    expect(primitive.salePrice).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(() => Product.create({ ...base, name: "   " })).toThrow(
      AppException,
    );
  });

  it("rejects an unknown unit", () => {
    expect(() =>
      Product.create({ ...base, unit: "TONELADA" as UnitOfMeasure }),
    ).toThrow(AppException);
  });

  it("rejects an unknown kind", () => {
    expect(() =>
      Product.create({ ...base, kind: "OUTRO" as ProductKind }),
    ).toThrow(AppException);
  });

  it("rejects a negative sale price", () => {
    expect(() => Product.create({ ...base, salePrice: -1 })).toThrow(
      AppException,
    );
  });
});

describe("buildSkuBase", () => {
  it("drops connectors and builds a short mnemonic", () => {
    expect(buildSkuBase("Bolo de Chocolate")).toBe("BOLOCH");
  });

  it("strips accents and non-alphanumeric characters", () => {
    expect(buildSkuBase("Brigadeiro Gourmet")).toBe("BRIGGO");
  });

  it("falls back to PROD when nothing usable remains", () => {
    expect(buildSkuBase("- / -")).toBe("PROD");
  });
});
