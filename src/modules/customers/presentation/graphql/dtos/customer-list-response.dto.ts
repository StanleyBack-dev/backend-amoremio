import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { CustomerResponseDto } from "@/modules/customers/presentation/graphql/dtos/customer-response.dto";

export const ListCustomersResponseDto = createListResponseDto(
  CustomerResponseDto,
  "ListCustomersResponseDto",
);

export const CustomerMutationResponseDto = createDataResponseDto(
  CustomerResponseDto,
  "CustomerMutationResponseDto",
);
