import type { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

export type ShoppingListItemView = {
  idShoppingListItem: string;
  idProduct: string;
  productName: string;
  unit: string;
  desiredQuantity: number;
  note: string | null;
  purchased: boolean;
};

export type ShoppingListView = {
  idShoppingList: string;
  idStore: string;
  name: string | null;
  status: ShoppingListStatus;
  notes: string | null;
  convertedToPurchaseId: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: ShoppingListItemView[];
};

export type ShoppingListUserOption = {
  id: string;
  name: string;
};

export type CreateShoppingListPayload = {
  idStore: string;
  name: string | null;
  notes: string | null;
  createdByUserId: string;
};

export type AddShoppingListItemPayload = {
  idShoppingList: string;
  idProduct: string;
  productName: string;
  unit: string;
  desiredQuantity: number;
  note: string | null;
};

export type AddShoppingListItemsPayload = {
  idShoppingList: string;
  items: Array<Omit<AddShoppingListItemPayload, "idShoppingList">>;
};

export type UpdateShoppingListItemPayload = {
  idShoppingList: string;
  idShoppingListItem: string;
  desiredQuantity?: number;
  note?: string | null;
  purchased?: boolean;
};

export type ListShoppingListsFilters = {
  page?: number;
  limit?: number;
  status?: ShoppingListStatus;
  createdByUserId?: string;
};

export interface ShoppingListRepositoryPort {
  create(payload: CreateShoppingListPayload): Promise<ShoppingListView>;
  findById(
    idStore: string,
    idShoppingList: string,
  ): Promise<ShoppingListView | null>;
  findByConvertedPurchaseId(
    idStore: string,
    idPurchase: string,
  ): Promise<ShoppingListView | null>;
  listByStore(
    idStore: string,
    filters?: ListShoppingListsFilters,
  ): Promise<{ records: ShoppingListView[]; total: number }>;
  addItem(payload: AddShoppingListItemPayload): Promise<ShoppingListView>;
  addItems(payload: AddShoppingListItemsPayload): Promise<ShoppingListView>;
  updateItem(payload: UpdateShoppingListItemPayload): Promise<ShoppingListView>;
  removeItem(
    idShoppingList: string,
    idShoppingListItem: string,
  ): Promise<ShoppingListView>;
  setStatus(
    idShoppingList: string,
    status: ShoppingListStatus,
  ): Promise<ShoppingListView>;
  markConverted(
    idShoppingList: string,
    idPurchase: string,
    convertedAt: Date,
  ): Promise<ShoppingListView>;
}

export const SHOPPING_LIST_REPOSITORY = Symbol("SHOPPING_LIST_REPOSITORY");
