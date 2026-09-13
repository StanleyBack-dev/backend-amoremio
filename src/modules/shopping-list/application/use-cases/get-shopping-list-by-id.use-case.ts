import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { loadShoppingListOrFail } from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class GetShoppingListByIdUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idShoppingList: string,
  ): Promise<ShoppingListView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return loadShoppingListOrFail(
      this.shoppingListRepository,
      idStore,
      idShoppingList,
    );
  }
}
