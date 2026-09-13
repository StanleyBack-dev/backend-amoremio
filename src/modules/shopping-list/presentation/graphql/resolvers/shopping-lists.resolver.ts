import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateShoppingListUseCase } from "@/modules/shopping-list/application/use-cases/create-shopping-list.use-case";
import { GetShoppingListByIdUseCase } from "@/modules/shopping-list/application/use-cases/get-shopping-list-by-id.use-case";
import { GetShoppingListByPurchaseIdUseCase } from "@/modules/shopping-list/application/use-cases/get-shopping-list-by-purchase-id.use-case";
import { ListShoppingListsUseCase } from "@/modules/shopping-list/application/use-cases/list-shopping-lists.use-case";
import { AddShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/add-shopping-list-item.use-case";
import { AddShoppingListItemsUseCase } from "@/modules/shopping-list/application/use-cases/add-shopping-list-items.use-case";
import { UpdateShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/update-shopping-list-item.use-case";
import { RemoveShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/remove-shopping-list-item.use-case";
import { CancelShoppingListUseCase } from "@/modules/shopping-list/application/use-cases/cancel-shopping-list.use-case";
import { ConvertShoppingListToPurchaseUseCase } from "@/modules/shopping-list/application/use-cases/convert-shopping-list-to-purchase.use-case";
import { ShoppingListResponseDto } from "@/modules/shopping-list/presentation/graphql/dtos/shopping-list-response.dto";
import {
  ListShoppingListsResponseDto,
  ShoppingListMutationResponseDto,
} from "@/modules/shopping-list/presentation/graphql/dtos/shopping-list-list-response.dto";
import {
  AddShoppingListItemInputDto,
  AddShoppingListItemsInputDto,
  CreateShoppingListInputDto,
  GetShoppingListByPurchaseIdInputDto,
  ListShoppingListsInputDto,
  RemoveShoppingListItemInputDto,
  ShoppingListScopeInputDto,
  UpdateShoppingListItemInputDto,
} from "@/modules/shopping-list/presentation/graphql/dtos/shopping-list-input.dtos";
import "@/modules/shopping-list/presentation/graphql/enums/shopping-list-graphql.enums";

@Resolver()
export class ShoppingListsResolver {
  constructor(
    private readonly createShoppingListUseCase: CreateShoppingListUseCase,
    private readonly getShoppingListByIdUseCase: GetShoppingListByIdUseCase,
    private readonly getShoppingListByPurchaseIdUseCase: GetShoppingListByPurchaseIdUseCase,
    private readonly listShoppingListsUseCase: ListShoppingListsUseCase,
    private readonly addShoppingListItemUseCase: AddShoppingListItemUseCase,
    private readonly addShoppingListItemsUseCase: AddShoppingListItemsUseCase,
    private readonly updateShoppingListItemUseCase: UpdateShoppingListItemUseCase,
    private readonly removeShoppingListItemUseCase: RemoveShoppingListItemUseCase,
    private readonly cancelShoppingListUseCase: CancelShoppingListUseCase,
    private readonly convertShoppingListToPurchaseUseCase: ConvertShoppingListToPurchaseUseCase,
  ) {}

  @Query(() => ListShoppingListsResponseDto, { name: "getStoreShoppingLists" })
  async getStoreShoppingLists(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListShoppingListsInputDto,
  ) {
    const result = await this.listShoppingListsUseCase.execute(
      user.idUsers,
      input,
    );
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) =>
          ShoppingListResponseDto.fromView(item),
        ),
      },
      RESPONSE_MESSAGES.shoppingList.listed,
    );
  }

  @Query(() => ShoppingListResponseDto, { name: "getShoppingListById" })
  async getShoppingListById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ShoppingListScopeInputDto,
  ) {
    const list = await this.getShoppingListByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idShoppingList,
    );
    return ShoppingListResponseDto.fromView(list);
  }

  @Query(() => ShoppingListResponseDto, {
    name: "getShoppingListByPurchaseId",
    nullable: true,
  })
  async getShoppingListByPurchaseId(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetShoppingListByPurchaseIdInputDto,
  ) {
    const list = await this.getShoppingListByPurchaseIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idPurchase,
    );
    return list ? ShoppingListResponseDto.fromView(list) : null;
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "createShoppingList",
  })
  async createShoppingList(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateShoppingListInputDto,
  ) {
    const created = await this.createShoppingListUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(created),
      RESPONSE_MESSAGES.shoppingList.created,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "addShoppingListItem",
  })
  async addShoppingListItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddShoppingListItemInputDto,
  ) {
    const updated = await this.addShoppingListItemUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(updated),
      RESPONSE_MESSAGES.shoppingList.updated,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "addShoppingListItems",
  })
  async addShoppingListItems(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddShoppingListItemsInputDto,
  ) {
    const updated = await this.addShoppingListItemsUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(updated),
      RESPONSE_MESSAGES.shoppingList.updated,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "updateShoppingListItem",
  })
  async updateShoppingListItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateShoppingListItemInputDto,
  ) {
    const updated = await this.updateShoppingListItemUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(updated),
      RESPONSE_MESSAGES.shoppingList.updated,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "removeShoppingListItem",
  })
  async removeShoppingListItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RemoveShoppingListItemInputDto,
  ) {
    const updated = await this.removeShoppingListItemUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idShoppingList,
      input.idShoppingListItem,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(updated),
      RESPONSE_MESSAGES.shoppingList.updated,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "cancelShoppingList",
  })
  async cancelShoppingList(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ShoppingListScopeInputDto,
  ) {
    const cancelled = await this.cancelShoppingListUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idShoppingList,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(cancelled),
      RESPONSE_MESSAGES.shoppingList.cancelled,
    );
  }

  @Mutation(() => ShoppingListMutationResponseDto, {
    name: "convertShoppingListToPurchase",
  })
  async convertShoppingListToPurchase(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ShoppingListScopeInputDto,
  ) {
    const converted = await this.convertShoppingListToPurchaseUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idShoppingList,
    );
    return buildDataResponse(
      ShoppingListResponseDto.fromView(converted),
      RESPONSE_MESSAGES.shoppingList.converted,
    );
  }
}
