import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { StoreResponseDto } from "@/modules/stores/presentation/graphql/dtos/store-response.dto";

export const StoreMutationResponseDto = createDataResponseDto(
  StoreResponseDto,
  "StoreMutationResponseDto",
);
