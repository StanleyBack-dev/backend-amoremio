import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { UpdateShoppingListItemCommand } from "@/modules/shopping-list/application/dto/shopping-list.commands";
import {
  assertOpen,
  loadShoppingListOrFail,
} from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class UpdateShoppingListItemUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateShoppingListItemCommand,
  ): Promise<ShoppingListView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const list = await loadShoppingListOrFail(
      this.shoppingListRepository,
      command.idStore,
      command.idShoppingList,
    );
    // Quantity/note only make sense while still curating the list. The
    // `purchased` checklist flag is meant to be ticked from the linked
    // purchase's screen precisely *after* conversion, so it's exempt.
    if (command.desiredQuantity !== undefined || command.note !== undefined) {
      assertOpen(list);
    }

    return this.shoppingListRepository.updateItem({
      idShoppingList: command.idShoppingList,
      idShoppingListItem: command.idShoppingListItem,
      desiredQuantity: command.desiredQuantity,
      note:
        command.note !== undefined
          ? (command.note ?? "").trim() || null
          : undefined,
      purchased: command.purchased,
    });
  }
}
