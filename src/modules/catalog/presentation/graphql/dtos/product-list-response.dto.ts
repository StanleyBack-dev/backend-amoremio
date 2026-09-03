import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { ProductResponseDto } from "@/modules/catalog/presentation/graphql/dtos/product-response.dto";

export const ListProductsResponseDto = createListResponseDto(
  ProductResponseDto,
  "ListProductsResponseDto",
);

export const ProductMutationResponseDto = createDataResponseDto(
  ProductResponseDto,
  "ProductMutationResponseDto",
);
