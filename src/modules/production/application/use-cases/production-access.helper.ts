import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  RecipeRepositoryPort,
  RecipeView,
} from "@/modules/production/application/ports/recipe-repository.port";
import type {
  ProductionOrderRepositoryPort,
  ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

export async function loadRecipeOrFail(
  repository: RecipeRepositoryPort,
  idStore: string,
  idRecipe: string,
): Promise<RecipeView> {
  const recipe = await repository.findRecipeById(idStore, idRecipe);
  if (!recipe) {
    throw AppException.from(APP_ERRORS.production.recipeNotFound, undefined);
  }
  return recipe;
}

export async function loadProductionOrderOrFail(
  repository: ProductionOrderRepositoryPort,
  idStore: string,
  idProductionOrder: string,
): Promise<ProductionOrderView> {
  const order = await repository.findOrderById(idStore, idProductionOrder);
  if (!order) {
    throw AppException.from(APP_ERRORS.production.orderNotFound, undefined);
  }
  return order;
}

export function assertDraft(order: ProductionOrderView): void {
  if (order.status !== ProductionOrderStatus.RASCUNHO) {
    throw AppException.from(APP_ERRORS.production.orderNotDraft, undefined);
  }
}
