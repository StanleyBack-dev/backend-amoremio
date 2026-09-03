import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { RecipeResponseDto } from "@/modules/production/presentation/graphql/dtos/recipe-response.dto";
import { ProductionOrderResponseDto } from "@/modules/production/presentation/graphql/dtos/production-order-response.dto";

export const ListRecipesResponseDto = createListResponseDto(
  RecipeResponseDto,
  "ListRecipesResponseDto",
);

export const RecipeMutationResponseDto = createDataResponseDto(
  RecipeResponseDto,
  "RecipeMutationResponseDto",
);

export const ListProductionOrdersResponseDto = createListResponseDto(
  ProductionOrderResponseDto,
  "ListProductionOrdersResponseDto",
);

export const ProductionOrderMutationResponseDto = createDataResponseDto(
  ProductionOrderResponseDto,
  "ProductionOrderMutationResponseDto",
);
