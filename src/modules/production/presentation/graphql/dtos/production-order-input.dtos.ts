import { Field, Float, InputType, Int } from "@nestjs/graphql";
import {
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
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

@InputType()
export class CreateProductionOrderInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  productionDate?: Date;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  batches!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class ProductionOrderScopeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idProductionOrder!: string;
}

@InputType()
export class ListProductionOrdersInputDto {
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

  @Field(() => ProductionOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  idRecipe?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetProductionOrderFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}

@InputType()
export class UpdateProductionOrderInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idProductionOrder!: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  productionDate?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  batches?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  actualOutputQuantity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
