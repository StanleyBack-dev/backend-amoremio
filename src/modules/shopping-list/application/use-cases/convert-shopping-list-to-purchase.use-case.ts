import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { CreatePurchaseDraftUseCase } from "@/modules/purchasing/application/use-cases/create-purchase-draft.use-case";
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
export class ConvertShoppingListToPurchaseUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly createPurchaseDraftUseCase: CreatePurchaseDraftUseCase,
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
    assertOpen(list);

    if (list.items.length === 0) {
      throw AppException.from(APP_ERRORS.shoppingList.emptyList, undefined);
    }

    // Only creates and links an empty purchase draft — items are never
    // copied over. The list's items stay a checklist the user ticks off by
    // hand from the Purchases screen while adding real purchase lines
    // manually (product, packaging, price); the two lists are related only
    // by reference, never kept in sync item-for-item.
    const purchase = await this.createPurchaseDraftUseCase.execute(userId, {
      idStore,
      notes: list.name
        ? `Vinculada à lista de compras "${list.name}".`
        : "Vinculada a uma lista de compras.",
    });

    return this.shoppingListRepository.markConverted(
      idShoppingList,
      purchase.idPurchase,
      new Date(),
    );
  }
}
