import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { PurchaseResponseDto } from "@/modules/purchasing/presentation/graphql/dtos/purchase-response.dto";

export const ListPurchasesResponseDto = createListResponseDto(
  PurchaseResponseDto,
  "ListPurchasesResponseDto",
);

export const PurchaseMutationResponseDto = createDataResponseDto(
  PurchaseResponseDto,
  "PurchaseMutationResponseDto",
);
