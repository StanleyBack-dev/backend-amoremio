import type { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import type { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import type { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

export class CreateProductCommand {
  idStore!: string;
  name!: string;
  description?: string | null;
  brand?: string | null;
  kind!: ProductKind;
  unit!: UnitOfMeasure;
  packagingUnit?: PackagingUnit | null;
  packSize?: number | null;
  salePrice?: number | null;
}

export class UpdateProductCommand {
  idStore!: string;
  idProduct!: string;
  name?: string;
  description?: string | null;
  brand?: string | null;
  kind?: ProductKind;
  unit?: UnitOfMeasure;
  packagingUnit?: PackagingUnit | null;
  packSize?: number | null;
  salePrice?: number | null;
  status?: boolean;
}

export class ListProductsQuery {
  idStore!: string;
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
}
