import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { currentDateOnly } from "@/common/utils/date.util";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  RECIPE_REPOSITORY,
  type RecipeRepositoryPort,
  type RecipeView,
} from "@/modules/production/application/ports/recipe-repository.port";
import {
  PRODUCTION_ORDER_REPOSITORY,
  type ProductionOrderFilterOptions,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import {
  CreateProductionOrderCommand,
  ListProductionOrdersQuery,
  UpdateProductionOrderCommand,
} from "@/modules/production/application/dto/production.commands";
import {
  assertDraft,
  loadProductionOrderOrFail,
  loadRecipeOrFail,
} from "@/modules/production/application/use-cases/production-access.helper";

export interface PaginatedProductionOrders {
  items: ProductionOrderView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// The consumption lines and planned output are always a straight multiple of
// the recipe by the batch count.
export function explodeRecipe(recipe: RecipeView, batches: number) {
  return {
    plannedOutputQuantity: round3(recipe.yieldQuantity * batches),
    items: recipe.items.map((item) => ({
      idProduct: item.idProduct,
      productName: item.productName,
      quantity: round3(item.quantity * batches),
      unit: item.unit,
    })),
  };
}

@Injectable()
export class ProductionOrderCrudUseCases {
  constructor(
    @Inject(PRODUCTION_ORDER_REPOSITORY)
    private readonly orderRepository: ProductionOrderRepositoryPort,
    @Inject(RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  private assertRegister(userId: string, idStore: string) {
    return this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_PRODUCTION,
    );
  }

  private assertView(userId: string, idStore: string) {
    return this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );
  }

  async create(
    userId: string,
    command: CreateProductionOrderCommand,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, command.idStore);

    const batches = Number(command.batches);
    if (!Number.isFinite(batches) || batches <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }

    const recipe = await loadRecipeOrFail(
      this.recipeRepository,
      command.idStore,
      command.idRecipe,
    );
    if (!recipe.status) {
      throw AppException.from(APP_ERRORS.production.recipeInactive, undefined);
    }
    if (recipe.items.length === 0) {
      throw AppException.from(APP_ERRORS.production.emptyOrder, undefined);
    }

    const exploded = explodeRecipe(recipe, batches);

    return this.orderRepository.createOrder({
      idStore: command.idStore,
      idRecipe: recipe.idRecipe,
      recipeName: recipe.name,
      idOutputProduct: recipe.idOutputProduct,
      outputProductName: recipe.outputProductName,
      productionDate: command.productionDate ?? currentDateOnly(),
      batches,
      plannedOutputQuantity: exploded.plannedOutputQuantity,
      actualOutputQuantity: exploded.plannedOutputQuantity,
      laborCost: round2(recipe.laborCost * batches),
      overheadCost: round2(recipe.overheadCost * batches),
      notes: (command.notes ?? "").trim() || null,
      createdByUserId: userId,
      items: exploded.items,
    });
  }

  async list(
    userId: string,
    query: ListProductionOrdersQuery,
  ): Promise<PaginatedProductionOrders> {
    await this.assertView(userId, query.idStore);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.orderRepository.listOrdersByStore(
      query.idStore,
      {
        page,
        limit,
        status: query.status,
        idRecipe: query.idRecipe,
        createdByUserId: query.createdByUserId,
      },
    );
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async filterOptions(
    userId: string,
    idStore: string,
  ): Promise<ProductionOrderFilterOptions> {
    await this.assertView(userId, idStore);
    return this.orderRepository.listOrderFilterOptions(idStore);
  }

  async getById(
    userId: string,
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView> {
    await this.assertView(userId, idStore);
    return loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
  }

  async update(
    userId: string,
    command: UpdateProductionOrderCommand,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, command.idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      command.idStore,
      command.idProductionOrder,
    );
    assertDraft(order);

    let batches: number | undefined;
    let plannedOutputQuantity: number | undefined;
    let items:
      | {
          idProduct: string;
          productName: string;
          quantity: number;
          unit: string;
        }[]
      | undefined;

    if (command.batches !== undefined) {
      batches = Number(command.batches);
      if (!Number.isFinite(batches) || batches <= 0) {
        throw AppException.from(
          APP_ERRORS.production.invalidQuantity,
          undefined,
        );
      }
      const recipe = await loadRecipeOrFail(
        this.recipeRepository,
        command.idStore,
        order.idRecipe,
      );
      const exploded = explodeRecipe(recipe, batches);
      plannedOutputQuantity = exploded.plannedOutputQuantity;
      items = exploded.items;
    }

    let actualOutputQuantity: number | undefined;
    if (command.actualOutputQuantity !== undefined) {
      actualOutputQuantity = Number(command.actualOutputQuantity);
      if (!Number.isFinite(actualOutputQuantity) || actualOutputQuantity <= 0) {
        throw AppException.from(
          APP_ERRORS.production.invalidQuantity,
          undefined,
        );
      }
    } else if (plannedOutputQuantity !== undefined) {
      // Batches changed without an explicit actual — keep them in sync.
      actualOutputQuantity = plannedOutputQuantity;
    }

    return this.orderRepository.updateOrder({
      idProductionOrder: command.idProductionOrder,
      productionDate: command.productionDate,
      batches,
      plannedOutputQuantity,
      actualOutputQuantity,
      laborCost:
        command.laborCost !== undefined
          ? round2(Math.max(command.laborCost, 0))
          : undefined,
      overheadCost:
        command.overheadCost !== undefined
          ? round2(Math.max(command.overheadCost, 0))
          : undefined,
      notes:
        command.notes !== undefined
          ? (command.notes ?? "").trim() || null
          : undefined,
      items,
    });
  }

  async cancel(
    userId: string,
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    if (order.status === ProductionOrderStatus.CONCLUIDA) {
      throw AppException.from(
        APP_ERRORS.production.cannotCancelConcluded,
        undefined,
      );
    }
    return this.orderRepository.setOrderStatus(
      idProductionOrder,
      ProductionOrderStatus.CANCELADA,
    );
  }
}
