export type RecipeItemView = {
  idRecipeItem: string;
  idProduct: string;
  productName: string;
  quantity: number;
  unit: string;
};

export type RecipeView = {
  idRecipe: string;
  idStore: string;
  idOutputProduct: string;
  outputProductName: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  laborCost: number;
  overheadCost: number;
  status: boolean;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: RecipeItemView[];
};

export type CreateRecipePayload = {
  idStore: string;
  idOutputProduct: string;
  outputProductName: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  laborCost: number;
  overheadCost: number;
  notes: string | null;
  createdByUserId: string;
};

export type UpdateRecipePayload = {
  idRecipe: string;
  name?: string;
  yieldQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  status?: boolean;
  notes?: string | null;
};

export type AddRecipeItemPayload = {
  idRecipe: string;
  idProduct: string;
  productName: string;
  quantity: number;
  unit: string;
};

export type AddRecipeItemsPayload = {
  idRecipe: string;
  items: Array<Omit<AddRecipeItemPayload, "idRecipe">>;
};

export type UpdateRecipeItemPayload = {
  idRecipe: string;
  idRecipeItem: string;
  quantity: number;
};

export type ListRecipesFilters = {
  page?: number;
  limit?: number;
  status?: boolean;
};

export interface RecipeRepositoryPort {
  createRecipe(payload: CreateRecipePayload): Promise<RecipeView>;
  findRecipeById(idStore: string, idRecipe: string): Promise<RecipeView | null>;
  findRecipeByOutputProduct(
    idStore: string,
    idOutputProduct: string,
  ): Promise<RecipeView | null>;
  listRecipesByStore(
    idStore: string,
    filters?: ListRecipesFilters,
  ): Promise<{ records: RecipeView[]; total: number }>;
  updateRecipe(payload: UpdateRecipePayload): Promise<RecipeView>;
  addRecipeItem(payload: AddRecipeItemPayload): Promise<RecipeView>;
  addRecipeItems(payload: AddRecipeItemsPayload): Promise<RecipeView>;
  updateRecipeItem(payload: UpdateRecipeItemPayload): Promise<RecipeView>;
  removeRecipeItem(idRecipe: string, idRecipeItem: string): Promise<RecipeView>;
}

export const RECIPE_REPOSITORY = Symbol("RECIPE_REPOSITORY");
