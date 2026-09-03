import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { ProductView } from "@/modules/catalog/application/ports/product-repository.port";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

@ObjectType()
export class ProductResponseDto {
  static fromView(view: ProductView): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.idProduct = view.idProduct;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.sku = view.sku;
    dto.description = view.description;
    dto.brand = view.brand;
    dto.kind = view.kind;
    dto.unit = view.unit;
    dto.packagingUnit = view.packagingUnit;
    dto.packSize = view.packSize;
    dto.salePrice = view.salePrice;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idProduct!: string;

  @Field()
  idStore!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field(() => ProductKind)
  kind!: ProductKind;

  @Field(() => UnitOfMeasure)
  unit!: UnitOfMeasure;

  @Field(() => PackagingUnit)
  packagingUnit!: PackagingUnit;

  @Field(() => Float)
  packSize!: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

  @Field()
  status!: boolean;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
