import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { SupplierResponseDto } from "@/modules/suppliers/presentation/graphql/dtos/supplier-response.dto";

export const ListSuppliersResponseDto = createListResponseDto(
  SupplierResponseDto,
  "ListSuppliersResponseDto",
);

export const SupplierMutationResponseDto = createDataResponseDto(
  SupplierResponseDto,
  "SupplierMutationResponseDto",
);
