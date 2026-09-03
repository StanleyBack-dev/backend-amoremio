import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { Money } from "@/shared/domain/value-objects/money.vo";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

export type ProductProps = {
  idStore: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  brand?: string | null;
  kind: ProductKind;
  unit: UnitOfMeasure;
  packagingUnit?: PackagingUnit | null;
  packSize?: number | null;
  salePrice?: number | null;
  createdByUserId: string;
};

export type ProductPrimitive = {
  idStore: string;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  kind: ProductKind;
  unit: UnitOfMeasure;
  packagingUnit: PackagingUnit;
  packSize: number;
  salePrice: number | null;
  createdByUserId: string;
};

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

export function normalizeSku(value: string | undefined | null): string | null {
  const normalized = normalizeText(value).toUpperCase();
  return normalized || null;
}

const SKU_STOPWORDS = new Set([
  "DE",
  "DA",
  "DO",
  "DAS",
  "DOS",
  "E",
  "COM",
  "SEM",
  "A",
  "O",
  "AS",
  "OS",
  "EM",
  "PARA",
]);

// Turns a product name into a short mnemonic code: strip accents, keep only
// letters/digits, drop connectors, then take 4 letters of the first
// meaningful word plus 2 of each of the next two. "Bolo de Chocolate" ->
// "BOLOCH". Always returns at least "PROD". The store-scoped numeric suffix
// that makes the SKU unique is added by the repository/use case.
export function buildSkuBase(name: string): string {
  const words = normalizeText(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word.length > 0 && !SKU_STOPWORDS.has(word));

  if (words.length === 0) {
    return "PROD";
  }

  const parts = [
    words[0].slice(0, 4),
    ...words.slice(1, 3).map((word) => word.slice(0, 2)),
  ];

  return parts.join("").slice(0, 10) || "PROD";
}

export function normalizeSalePrice(
  value: number | undefined | null,
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return Money.fromNumber(value).toNumber();
}

export function assertValidUnit(value: unknown): UnitOfMeasure {
  if (!Object.values(UnitOfMeasure).includes(value as UnitOfMeasure)) {
    throw AppException.from(APP_ERRORS.validation.invalidFormat, {
      value: "unit",
    });
  }
  return value as UnitOfMeasure;
}

export function assertValidPackagingUnit(value: unknown): PackagingUnit {
  if (!Object.values(PackagingUnit).includes(value as PackagingUnit)) {
    throw AppException.from(APP_ERRORS.validation.invalidFormat, {
      value: "packagingUnit",
    });
  }
  return value as PackagingUnit;
}

export function normalizePackSize(value: number | undefined | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  // Keep 3 decimals, mirroring the DB column.
  return Math.round(parsed * 1000) / 1000;
}

export function assertValidKind(value: unknown): ProductKind {
  if (!Object.values(ProductKind).includes(value as ProductKind)) {
    throw AppException.from(APP_ERRORS.validation.invalidFormat, {
      value: "kind",
    });
  }
  return value as ProductKind;
}

export class Product {
  private constructor(private readonly props: ProductPrimitive) {}

  static create(props: ProductProps): Product {
    const name = normalizeText(props.name);
    if (!name) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "name",
      });
    }

    if (!props.createdByUserId) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "createdByUserId",
      });
    }

    if (!props.idStore) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "idStore",
      });
    }

    return new Product({
      idStore: props.idStore,
      name,
      sku: normalizeSku(props.sku),
      description: normalizeText(props.description) || null,
      brand: normalizeText(props.brand) || null,
      kind: assertValidKind(props.kind),
      unit: assertValidUnit(props.unit),
      packagingUnit: assertValidPackagingUnit(
        props.packagingUnit ?? PackagingUnit.UNIDADE,
      ),
      packSize: normalizePackSize(props.packSize),
      salePrice: normalizeSalePrice(props.salePrice),
      createdByUserId: props.createdByUserId,
    });
  }

  toPrimitive(): ProductPrimitive {
    return this.props;
  }
}
