import type { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

export class CreateRecipeCommand {
  idStore!: string;
  idOutputProduct!: string;
  name?: string | null;
  yieldQuantity!: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string | null;
}

export class UpdateRecipeCommand {
  idStore!: string;
  idRecipe!: string;
  name?: string;
  yieldQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  status?: boolean;
  notes?: string | null;
}

export class AddRecipeItemCommand {
  idStore!: string;
  idRecipe!: string;
  idProduct!: string;
  quantity!: number;
}

export class AddRecipeItemsCommand {
  idStore!: string;
  idRecipe!: string;
  items!: Array<{ idProduct: string; quantity: number }>;
}

export class UpdateRecipeItemCommand {
  idStore!: string;
  idRecipe!: string;
  idRecipeItem!: string;
  quantity!: number;
}

export class ListRecipesQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  status?: boolean;
}

export class CreateProductionOrderCommand {
  idStore!: string;
  idRecipe!: string;
  productionDate?: Date;
  batches!: number;
  notes?: string | null;
}

export class UpdateProductionOrderCommand {
  idStore!: string;
  idProductionOrder!: string;
  productionDate?: Date;
  batches?: number;
  actualOutputQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string | null;
}

export class ListProductionOrdersQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  status?: ProductionOrderStatus;
  idRecipe?: string;
  createdByUserId?: string;
}
