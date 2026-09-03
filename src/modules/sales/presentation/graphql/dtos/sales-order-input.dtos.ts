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
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

@InputType()
export class CreateSalesOrderInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  orderDate?: Date;

  @Field(() => SalesChannel, { nullable: true })
  @IsOptional()
  @IsEnum(SalesChannel)
  salesChannel?: SalesChannel;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class SalesOrderScopeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSalesOrder!: string;
}

@InputType()
export class ListSalesOrdersInputDto {
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

  @Field(() => SalesOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @Field(() => SalesChannel, { nullable: true })
  @IsOptional()
  @IsEnum(SalesChannel)
  salesChannel?: SalesChannel;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetSalesOrderFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}

@InputType()
export class UpdateSalesOrderHeaderInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSalesOrder!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  orderDate?: Date;

  @Field(() => SalesChannel, { nullable: true })
  @IsOptional()
  @IsEnum(SalesChannel)
  salesChannel?: SalesChannel;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @Field(() => SalesDiscountMode, { nullable: true })
  @IsOptional()
  @IsEnum(SalesDiscountMode)
  discountMode?: SalesDiscountMode;

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
export class AddSalesOrderItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSalesOrder!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

@InputType()
export class RemoveSalesOrderItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSalesOrder!: string;

  @Field()
  @IsUUID()
  idSalesOrderItem!: string;
}

@InputType()
export class UpdateSalesOrderItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSalesOrder!: string;

  @Field()
  @IsUUID()
  idSalesOrderItem!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
