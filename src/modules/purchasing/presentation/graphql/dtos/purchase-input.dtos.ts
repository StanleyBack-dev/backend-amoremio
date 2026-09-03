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
import { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

@InputType()
export class CreatePurchaseDraftInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplierName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  purchaseDate?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class PurchaseScopeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;
}

@InputType()
export class ListPurchasesInputDto {
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

  @Field(() => PurchaseStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplierName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetPurchaseFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}

@InputType()
export class UpdatePurchaseHeaderInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplierName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  purchaseDate?: Date;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freightAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @Field(() => PurchaseDiscountMode, { nullable: true })
  @IsOptional()
  @IsEnum(PurchaseDiscountMode)
  discountMode?: PurchaseDiscountMode;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class AddPurchaseItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  purchasedQuantity!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  purchasedUnit?: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  conversionFactor!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

@InputType()
export class UpdatePurchaseItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;

  @Field()
  @IsUUID()
  idPurchaseItem!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  purchasedQuantity?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  purchasedUnit?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  conversionFactor?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

@InputType()
export class RemovePurchaseItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;

  @Field()
  @IsUUID()
  idPurchaseItem!: string;
}
