import { Field, Float, InputType, Int } from "@nestjs/graphql";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

@InputType()
export class CreateProductInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @Field(() => ProductKind)
  @IsEnum(ProductKind)
  kind!: ProductKind;

  @Field(() => UnitOfMeasure)
  @IsEnum(UnitOfMeasure)
  unit!: UnitOfMeasure;

  @Field(() => PackagingUnit, { nullable: true })
  @IsOptional()
  @IsEnum(PackagingUnit)
  packagingUnit?: PackagingUnit;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  packSize?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  salePrice?: number;
}

@InputType()
export class UpdateProductInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @Field(() => ProductKind, { nullable: true })
  @IsOptional()
  @IsEnum(ProductKind)
  kind?: ProductKind;

  @Field(() => UnitOfMeasure, { nullable: true })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unit?: UnitOfMeasure;

  @Field(() => PackagingUnit, { nullable: true })
  @IsOptional()
  @IsEnum(PackagingUnit)
  packagingUnit?: PackagingUnit;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  packSize?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  salePrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class GetProductByIdInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idProduct!: string;
}

@InputType()
export class ListProductsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => [ProductKind], { nullable: true })
  @IsOptional()
  @IsEnum(ProductKind, { each: true })
  kinds?: ProductKind[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  withoutBrand?: boolean;

  @Field(() => UnitOfMeasure, { nullable: true })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unit?: UnitOfMeasure;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetProductFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}
