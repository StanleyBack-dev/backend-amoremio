import { Field, Float, Int, InputType } from "@nestjs/graphql";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

@InputType()
export class ListStoreStockInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

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

  @Field(() => ProductKind, { nullable: true })
  @IsOptional()
  @IsEnum(ProductKind)
  kind?: ProductKind;

  @Field(() => UnitOfMeasure, { nullable: true })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unit?: UnitOfMeasure;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

@InputType()
export class ListStockMovementsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  idProduct?: string;

  @Field(() => StockMovementType, { nullable: true })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

@InputType()
export class AdjustStockInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => StockMovementType)
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
