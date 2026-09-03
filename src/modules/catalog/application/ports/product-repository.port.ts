import type { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import type { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import type { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

export type CreateProductPayload = {
  idStore: string;
  name: string;
  sku: string;
  description: string | null;
  brand: string | null;
  kind: ProductKind;
  unit: UnitOfMeasure;
  packagingUnit: PackagingUnit;
  packSize: number;
  salePrice: number | null;
  createdByUserId: string;
};

export type UpdateProductPayload = {
  idProduct: string;
  idStore: string;
  name?: string;
  description?: string | null;
  brand?: string | null;
  kind?: ProductKind;
  unit?: UnitOfMeasure;
  packagingUnit?: PackagingUnit;
  packSize?: number;
  salePrice?: number | null;
  status?: boolean;
};

export type ProductView = {
  idProduct: string;
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
  status: boolean;
  createdByUserId: string;
  createdByUserName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserOption = {
  id: string;
  name: string;
};

export type ListProductsFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  kinds?: ProductKind[];
  name?: string;
  brand?: string;
  withoutBrand?: boolean;
  unit?: UnitOfMeasure;
  createdByUserId?: string;
};

export type ProductFilterOptions = {
  names: string[];
  brands: string[];
  creators: UserOption[];
};

export interface ProductRepositoryPort {
  create(payload: CreateProductPayload): Promise<ProductView>;
  update(payload: UpdateProductPayload): Promise<ProductView>;
  findById(idStore: string, idProduct: string): Promise<ProductView | null>;
  // Batch lookup — returns only the ids that exist in the store, in no
  // particular order. Creator names are not resolved.
  findManyByIds(idStore: string, idProducts: string[]): Promise<ProductView[]>;
  // When `brand` is a non-empty string, the match is scoped to that name/brand
  // pair; otherwise it matches on the name alone.
  findByName(
    idStore: string,
    name: string,
    brand?: string | null,
  ): Promise<ProductView | null>;
  findBySku(idStore: string, sku: string): Promise<ProductView | null>;
  countBySkuBase(idStore: string, base: string): Promise<number>;
  listByStore(
    idStore: string,
    filters?: ListProductsFilters,
  ): Promise<{ records: ProductView[]; total: number }>;
  listFilterOptions(idStore: string): Promise<ProductFilterOptions>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
