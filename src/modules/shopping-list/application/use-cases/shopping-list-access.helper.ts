import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  ShoppingListRepositoryPort,
  ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

export async function loadShoppingListOrFail(
  repository: ShoppingListRepositoryPort,
  idStore: string,
  idShoppingList: string,
): Promise<ShoppingListView> {
  const list = await repository.findById(idStore, idShoppingList);
  if (!list) {
    throw AppException.from(APP_ERRORS.shoppingList.notFound, undefined);
  }
  return list;
}

export function assertOpen(list: ShoppingListView): void {
  if (list.status !== ShoppingListStatus.ABERTA) {
    throw AppException.from(APP_ERRORS.shoppingList.notOpen, undefined);
  }
}
