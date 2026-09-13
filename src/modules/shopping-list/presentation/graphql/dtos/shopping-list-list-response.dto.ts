import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { ShoppingListResponseDto } from "@/modules/shopping-list/presentation/graphql/dtos/shopping-list-response.dto";

export const ListShoppingListsResponseDto = createListResponseDto(
  ShoppingListResponseDto,
  "ListShoppingListsResponseDto",
);

export const ShoppingListMutationResponseDto = createDataResponseDto(
  ShoppingListResponseDto,
  "ShoppingListMutationResponseDto",
);
