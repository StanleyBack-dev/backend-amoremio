import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { SalesOrderResponseDto } from "@/modules/sales/presentation/graphql/dtos/sales-order-response.dto";

export const ListSalesOrdersResponseDto = createListResponseDto(
  SalesOrderResponseDto,
  "ListSalesOrdersResponseDto",
);

export const SalesOrderMutationResponseDto = createDataResponseDto(
  SalesOrderResponseDto,
  "SalesOrderMutationResponseDto",
);
