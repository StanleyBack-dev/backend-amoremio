import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { BaseResponseDto } from "@/common/responses/dtos/base-response.dto";
import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import {
  StockItemResponseDto,
  StockMovementResponseDto,
} from "@/modules/inventory/presentation/graphql/dtos/inventory-response.dtos";

@ObjectType("ListStoreStockResponseDto")
export class ListStoreStockResponseDto extends BaseResponseDto {
  @Field(() => [StockItemResponseDto])
  items!: StockItemResponseDto[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  currentPage!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field()
  hasNextPage!: boolean;

  // Sum of quantity × average cost across ALL rows that match the filter,
  // not just the current page — the page shows a running total.
  @Field(() => Float)
  stockValueTotal!: number;
}

export const ListStockMovementsResponseDto = createListResponseDto(
  StockMovementResponseDto,
  "ListStockMovementsResponseDto",
);
