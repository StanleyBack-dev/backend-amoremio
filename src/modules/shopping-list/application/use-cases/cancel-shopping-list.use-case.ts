import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";
import { loadShoppingListOrFail } from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class CancelShoppingListUseCase {
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
      StorePermission.REGISTER_PURCHASE,
    );

    const list = await loadShoppingListOrFail(
      this.shoppingListRepository,
      idStore,
      idShoppingList,
    );

    if (list.status === ShoppingListStatus.CONVERTIDA) {
      throw AppException.from(
        APP_ERRORS.shoppingList.cannotCancelConverted,
        undefined,
      );
    }
    if (list.status === ShoppingListStatus.CANCELADA) {
      return list;
    }

    return this.shoppingListRepository.setStatus(
      idShoppingList,
      ShoppingListStatus.CANCELADA,
    );
  }
}
