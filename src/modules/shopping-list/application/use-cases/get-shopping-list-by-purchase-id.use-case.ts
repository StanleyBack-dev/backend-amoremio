import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";

@Injectable()
export class GetShoppingListByPurchaseIdUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  // Returns null (not a 404) when no list is linked — this is a normal,
  // frequent case: most purchases are created directly, without a list.
  async execute(
    userId: string,
    idStore: string,
    idPurchase: string,
  ): Promise<ShoppingListView | null> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.shoppingListRepository.findByConvertedPurchaseId(
      idStore,
      idPurchase,
    );
  }
}
