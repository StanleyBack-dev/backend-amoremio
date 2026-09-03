import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { BrandResponseDto } from "@/modules/brands/presentation/graphql/dtos/brand-response.dto";

export const ListBrandsResponseDto = createListResponseDto(
  BrandResponseDto,
  "ListBrandsResponseDto",
);

export const BrandMutationResponseDto = createDataResponseDto(
  BrandResponseDto,
  "BrandMutationResponseDto",
);
