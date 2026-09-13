import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import {
  assertOpen,
  loadShoppingListOrFail,
} from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class RemoveShoppingListItemUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idShoppingList: string,
    idShoppingListItem: string,
  ): Promise<ShoppingListView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const list = await loadShoppingListOrFail(
      this.shoppingListRepository,
      idStore,
      idShoppingList,
    );
    assertOpen(list);

    return this.shoppingListRepository.removeItem(
      idShoppingList,
      idShoppingListItem,
    );
  }
}
