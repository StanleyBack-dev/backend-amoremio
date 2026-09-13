import type { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

export class CreateShoppingListCommand {
  idStore!: string;
  name?: string | null;
  notes?: string | null;
}

export class AddShoppingListItemCommand {
  idStore!: string;
  idShoppingList!: string;
  idProduct!: string;
  desiredQuantity!: number;
  note?: string | null;
}

export class AddShoppingListItemsCommand {
  idStore!: string;
  idShoppingList!: string;
  items!: Array<{
    idProduct: string;
    desiredQuantity: number;
    note?: string | null;
  }>;
}

export class UpdateShoppingListItemCommand {
  idStore!: string;
  idShoppingList!: string;
  idShoppingListItem!: string;
  desiredQuantity?: number;
  note?: string | null;
  // Purely a checklist flag, toggled from the linked purchase's screen — does
  // not require the list to still be ABERTA (unlike quantity/note edits).
  purchased?: boolean;
}

export class ListShoppingListsQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  status?: ShoppingListStatus;
  createdByUserId?: string;
}
