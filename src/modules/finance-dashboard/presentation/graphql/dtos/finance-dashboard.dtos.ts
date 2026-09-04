import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from "@nestjs/graphql";
import { IsOptional, IsUUID } from "class-validator";
import type { FinanceDashboardResult } from "@/modules/finance-dashboard/application/use-cases/get-finance-dashboard.use-case";

export enum DashboardGranularityEnum {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

registerEnumType(DashboardGranularityEnum, { name: "DashboardGranularity" });

@InputType()
export class FinanceDashboardInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  from?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  to?: Date;
}

@ObjectType()
class DashboardTotalsDto {
  @Field(() => Float) totalPurchases!: number;
  @Field(() => Float) totalSales!: number;
  @Field(() => Float) totalCommission!: number;
  @Field(() => Float) netSales!: number;
  @Field(() => Float) costOfGoodsSold!: number;
  @Field(() => Float) grossMargin!: number;
  @Field(() => Float) grossMarginPercent!: number;
  @Field(() => Int) purchaseCount!: number;
  @Field(() => Int) salesCount!: number;
}

@ObjectType()
class SalesChannelDto {
  @Field() channel!: string;
  @Field(() => Int) orderCount!: number;
  @Field(() => Float) grossSales!: number;
  @Field(() => Float) commission!: number;
  @Field(() => Float) netSales!: number;
}

@ObjectType()
class TopProductDto {
  @Field() idProduct!: string;
  @Field() productName!: string;
  @Field(() => Float) quantitySold!: number;
  @Field(() => Float) revenue!: number;
}

@ObjectType()
class ProductProfitabilityDto {
  @Field() idProduct!: string;
  @Field() productName!: string;
  @Field(() => Float) quantitySold!: number;
  @Field(() => Float) revenue!: number;
  @Field(() => Float) cost!: number;
  @Field(() => Float) grossProfit!: number;
  @Field(() => Float) commission!: number;
  @Field(() => Float) netProfit!: number;
  @Field(() => Float) marginPercent!: number;
}

@ObjectType()
class TimeSeriesPointDto {
  @Field() date!: string;
  @Field(() => Float) purchases!: number;
  @Field(() => Float) sales!: number;
}

@ObjectType()
export class FinanceDashboardResponseDto {
  static fromResult(
    result: FinanceDashboardResult,
  ): FinanceDashboardResponseDto {
    const dto = new FinanceDashboardResponseDto();
    dto.from = result.from;
    dto.to = result.to;
    dto.totals = result.totals;
    dto.stockValue = result.stockValue;
    dto.topProducts = result.topProducts;
    dto.productProfitability = result.productProfitability;
    dto.granularity = result.granularity as DashboardGranularityEnum;
    dto.timeSeries = result.timeSeries;
    dto.salesByChannel = result.salesByChannel;
    return dto;
  }

  @Field(() => Date)
  from!: Date;

  @Field(() => Date)
  to!: Date;

  @Field(() => DashboardTotalsDto)
  totals!: DashboardTotalsDto;

  @Field(() => Float)
  stockValue!: number;

  @Field(() => [TopProductDto])
  topProducts!: TopProductDto[];

  @Field(() => [ProductProfitabilityDto])
  productProfitability!: ProductProfitabilityDto[];

  @Field(() => DashboardGranularityEnum)
  granularity!: DashboardGranularityEnum;

  @Field(() => [TimeSeriesPointDto])
  timeSeries!: TimeSeriesPointDto[];

  @Field(() => [SalesChannelDto])
  salesByChannel!: SalesChannelDto[];
}
