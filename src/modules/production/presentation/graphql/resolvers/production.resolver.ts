import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { RecipeCrudUseCases } from "@/modules/production/application/use-cases/recipe-crud.use-cases";
import { ProductionOrderCrudUseCases } from "@/modules/production/application/use-cases/production-order-crud.use-cases";
import { CompleteProductionOrderUseCase } from "@/modules/production/application/use-cases/complete-production-order.use-case";
import { RecipeResponseDto } from "@/modules/production/presentation/graphql/dtos/recipe-response.dto";
import { ProductionOrderResponseDto } from "@/modules/production/presentation/graphql/dtos/production-order-response.dto";
import { ProductionOrderFilterOptionsDto } from "@/modules/production/presentation/graphql/dtos/production-filter-options.dto";
import {
  ListProductionOrdersResponseDto,
  ListRecipesResponseDto,
  ProductionOrderMutationResponseDto,
  RecipeMutationResponseDto,
} from "@/modules/production/presentation/graphql/dtos/production-list-response.dto";
import {
  AddRecipeItemInputDto,
  AddRecipeItemsInputDto,
  CreateRecipeInputDto,
  ListRecipesInputDto,
  RecipeScopeInputDto,
  RemoveRecipeItemInputDto,
  UpdateRecipeInputDto,
  UpdateRecipeItemInputDto,
} from "@/modules/production/presentation/graphql/dtos/recipe-input.dtos";
import {
  CreateProductionOrderInputDto,
  GetProductionOrderFilterOptionsInputDto,
  ListProductionOrdersInputDto,
  ProductionOrderScopeInputDto,
  UpdateProductionOrderInputDto,
} from "@/modules/production/presentation/graphql/dtos/production-order-input.dtos";
import "@/modules/production/presentation/graphql/enums/production-graphql.enums";

@Resolver()
export class ProductionResolver {
  constructor(
    private readonly recipeCrud: RecipeCrudUseCases,
    private readonly orderCrud: ProductionOrderCrudUseCases,
    private readonly completeProductionOrderUseCase: CompleteProductionOrderUseCase,
  ) {}

  // --- Recipes ---------------------------------------------------------

  @Query(() => ListRecipesResponseDto, { name: "getStoreRecipes" })
  async getStoreRecipes(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListRecipesInputDto,
  ) {
    const result = await this.recipeCrud.list(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => RecipeResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.production.recipesListed,
    );
  }

  @Query(() => RecipeResponseDto, { name: "getRecipeById" })
  async getRecipeById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RecipeScopeInputDto,
  ) {
    const recipe = await this.recipeCrud.getById(
      user.idUsers,
      input.idStore,
      input.idRecipe,
    );
    return RecipeResponseDto.fromView(recipe);
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "createRecipe" })
  async createRecipe(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateRecipeInputDto,
  ) {
    const created = await this.recipeCrud.create(user.idUsers, input);
    return buildDataResponse(
      RecipeResponseDto.fromView(created),
      RESPONSE_MESSAGES.production.recipeCreated,
    );
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "updateRecipe" })
  async updateRecipe(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateRecipeInputDto,
  ) {
    const updated = await this.recipeCrud.update(user.idUsers, input);
    return buildDataResponse(
      RecipeResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.recipeUpdated,
    );
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "addRecipeItem" })
  async addRecipeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddRecipeItemInputDto,
  ) {
    const updated = await this.recipeCrud.addItem(user.idUsers, input);
    return buildDataResponse(
      RecipeResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.recipeUpdated,
    );
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "addRecipeItems" })
  async addRecipeItems(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddRecipeItemsInputDto,
  ) {
    const updated = await this.recipeCrud.addItems(user.idUsers, input);
    return buildDataResponse(
      RecipeResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.recipeUpdated,
    );
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "updateRecipeItem" })
  async updateRecipeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateRecipeItemInputDto,
  ) {
    const updated = await this.recipeCrud.updateItem(user.idUsers, input);
    return buildDataResponse(
      RecipeResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.recipeUpdated,
    );
  }

  @Mutation(() => RecipeMutationResponseDto, { name: "removeRecipeItem" })
  async removeRecipeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RemoveRecipeItemInputDto,
  ) {
    const updated = await this.recipeCrud.removeItem(
      user.idUsers,
      input.idStore,
      input.idRecipe,
      input.idRecipeItem,
    );
    return buildDataResponse(
      RecipeResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.recipeUpdated,
    );
  }

  // --- Production orders ----------------------------------------------

  @Query(() => ListProductionOrdersResponseDto, {
    name: "getStoreProductionOrders",
  })
  async getStoreProductionOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListProductionOrdersInputDto,
  ) {
    const result = await this.orderCrud.list(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) =>
          ProductionOrderResponseDto.fromView(item),
        ),
      },
      RESPONSE_MESSAGES.production.ordersListed,
    );
  }

  @Query(() => ProductionOrderFilterOptionsDto, {
    name: "getStoreProductionOrderFilterOptions",
  })
  async getStoreProductionOrderFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetProductionOrderFilterOptionsInputDto,
  ) {
    const options = await this.orderCrud.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return ProductionOrderFilterOptionsDto.fromView(options);
  }

  @Query(() => ProductionOrderResponseDto, { name: "getProductionOrderById" })
  async getProductionOrderById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ProductionOrderScopeInputDto,
  ) {
    const order = await this.orderCrud.getById(
      user.idUsers,
      input.idStore,
      input.idProductionOrder,
    );
    return ProductionOrderResponseDto.fromView(order);
  }

  @Mutation(() => ProductionOrderMutationResponseDto, {
    name: "createProductionOrder",
  })
  async createProductionOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateProductionOrderInputDto,
  ) {
    const created = await this.orderCrud.create(user.idUsers, input);
    return buildDataResponse(
      ProductionOrderResponseDto.fromView(created),
      RESPONSE_MESSAGES.production.orderCreated,
    );
  }

  @Mutation(() => ProductionOrderMutationResponseDto, {
    name: "updateProductionOrder",
  })
  async updateProductionOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateProductionOrderInputDto,
  ) {
    const updated = await this.orderCrud.update(user.idUsers, input);
    return buildDataResponse(
      ProductionOrderResponseDto.fromView(updated),
      RESPONSE_MESSAGES.production.orderUpdated,
    );
  }

  @Mutation(() => ProductionOrderMutationResponseDto, {
    name: "completeProductionOrder",
  })
  async completeProductionOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ProductionOrderScopeInputDto,
  ) {
    const completed = await this.completeProductionOrderUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idProductionOrder,
    );
    return buildDataResponse(
      ProductionOrderResponseDto.fromView(completed),
      RESPONSE_MESSAGES.production.orderConcluded,
    );
  }

  @Mutation(() => ProductionOrderMutationResponseDto, {
    name: "cancelProductionOrder",
  })
  async cancelProductionOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ProductionOrderScopeInputDto,
  ) {
    const cancelled = await this.orderCrud.cancel(
      user.idUsers,
      input.idStore,
      input.idProductionOrder,
    );
    return buildDataResponse(
      ProductionOrderResponseDto.fromView(cancelled),
      RESPONSE_MESSAGES.production.orderCancelled,
    );
  }
}
