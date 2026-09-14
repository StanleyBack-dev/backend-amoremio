import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { currentDateOnly } from "@/common/utils/date.util";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import {
  PRODUCIBLE_INPUT_KINDS,
  PRODUCIBLE_OUTPUT_KINDS,
} from "@/modules/catalog/domain/enums/product-kind.enum";
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
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
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

  // Recreates recipe, batches, mão de obra/outros custos, and every output
  // (+ its extras) as a brand-new draft — one call instead of the client
  // driving create + N addOutput + M addOutputExtra one at a time. Items are
  // re-exploded from the recipe as it stands today (same as a fresh
  // create()), not copied from the source order's possibly-stale snapshot.
  async duplicate(
    userId: string,
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const source = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );

    const recipe = await loadRecipeOrFail(
      this.recipeRepository,
      idStore,
      source.idRecipe,
    );
    if (!recipe.status) {
      throw AppException.from(APP_ERRORS.production.recipeInactive, undefined);
    }
    if (recipe.items.length === 0) {
      throw AppException.from(APP_ERRORS.production.emptyOrder, undefined);
    }
    const exploded = explodeRecipe(recipe, source.batches);

    // Re-validate every product the source order's outputs/extras reference
    // still exists and is still the right kind — a duplicate must never
    // silently carry forward a reference to something deleted since.
    const referencedIds = [
      ...new Set([
        ...source.outputs.map((output) => output.idProduct),
        ...source.outputs.flatMap((output) =>
          output.extras.map((extra) => extra.idProduct),
        ),
      ]),
    ];
    const productById = new Map(
      referencedIds.length > 0
        ? (
            await this.productRepository.findManyByIds(idStore, referencedIds)
          ).map((product) => [product.idProduct, product] as const)
        : [],
    );

    const outputs = source.outputs.map((output) => {
      const product = productById.get(output.idProduct);
      if (!product) {
        throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
      }
      if (!PRODUCIBLE_OUTPUT_KINDS.includes(product.kind)) {
        throw AppException.from(
          APP_ERRORS.production.outputNotFinishedGood,
          undefined,
        );
      }
      const extras = output.extras.map((extra) => {
        const extraProduct = productById.get(extra.idProduct);
        if (!extraProduct) {
          throw AppException.from(
            APP_ERRORS.catalog.productNotFound,
            undefined,
          );
        }
        if (!PRODUCIBLE_INPUT_KINDS.includes(extraProduct.kind)) {
          throw AppException.from(
            APP_ERRORS.production.inputNotInsumo,
            undefined,
          );
        }
        return {
          idProduct: extra.idProduct,
          productName: extraProduct.name,
          quantity: extra.quantity,
        };
      });
      return {
        idProduct: output.idProduct,
        productName: product.name,
        quantity: output.quantity,
        extras,
      };
    });

    return this.orderRepository.duplicateOrder({
      idStore,
      idRecipe: recipe.idRecipe,
      recipeName: recipe.name,
      idOutputProduct: recipe.idOutputProduct,
      outputProductName: recipe.outputProductName,
      productionDate: currentDateOnly(),
      batches: source.batches,
      plannedOutputQuantity: exploded.plannedOutputQuantity,
      actualOutputQuantity: exploded.plannedOutputQuantity,
      laborCost: source.laborCost,
      overheadCost: source.overheadCost,
      notes: source.notes,
      createdByUserId: userId,
      items: exploded.items,
      outputs,
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

  // Re-explodes the recipe as it stands right now and replaces the order's
  // items with it — for when the recipe was edited after this draft was
  // created and the change (new/removed/changed-quantity ingredient) never
  // reached this order's cost preview. Labor/overhead are left untouched;
  // `actualOutputQuantity` only follows the new plan if it hadn't already
  // been manually overridden away from the old plan.
  async syncWithRecipe(
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
    assertDraft(order);

    const recipe = await loadRecipeOrFail(
      this.recipeRepository,
      idStore,
      order.idRecipe,
    );
    if (recipe.items.length === 0) {
      throw AppException.from(APP_ERRORS.production.emptyOrder, undefined);
    }
    const exploded = explodeRecipe(recipe, order.batches);

    const actualOutputQuantity =
      Math.abs(order.actualOutputQuantity - order.plannedOutputQuantity) < 0.001
        ? exploded.plannedOutputQuantity
        : undefined;

    return this.orderRepository.updateOrder({
      idProductionOrder,
      plannedOutputQuantity: exploded.plannedOutputQuantity,
      actualOutputQuantity,
      items: exploded.items,
    });
  }

  // Outputs/extras persist as soon as they're added — same "add to list"
  // pattern Compras/Vendas use for items — instead of living only in the
  // browser until the order is completed, which was losing them on refresh.
  async addOutput(
    userId: string,
    idStore: string,
    idProductionOrder: string,
    idProduct: string,
    quantity: number,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }
    if (order.outputs.some((output) => output.idProduct === idProduct)) {
      throw AppException.from(
        APP_ERRORS.production.duplicatedProductionOutput,
        undefined,
      );
    }
    const product = await this.productRepository.findById(idStore, idProduct);
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }
    if (!PRODUCIBLE_OUTPUT_KINDS.includes(product.kind)) {
      throw AppException.from(
        APP_ERRORS.production.outputNotFinishedGood,
        undefined,
      );
    }
    return this.orderRepository.addOutput({
      idProductionOrder,
      idProduct,
      productName: product.name,
      quantity,
    });
  }

  async removeOutput(
    userId: string,
    idStore: string,
    idProductionOrder: string,
    idProductionOrderOutput: string,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);
    const exists = order.outputs.some(
      (output) => output.idProductionOrderOutput === idProductionOrderOutput,
    );
    if (!exists) {
      throw AppException.from(APP_ERRORS.production.outputNotFound, undefined);
    }
    return this.orderRepository.removeOutput(
      idProductionOrder,
      idProductionOrderOutput,
    );
  }

  async addOutputExtra(
    userId: string,
    idStore: string,
    idProductionOrder: string,
    idProductionOrderOutput: string,
    idProduct: string,
    quantity: number,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }
    const output = order.outputs.find(
      (candidate) =>
        candidate.idProductionOrderOutput === idProductionOrderOutput,
    );
    if (!output) {
      throw AppException.from(APP_ERRORS.production.outputNotFound, undefined);
    }
    if (output.extras.some((extra) => extra.idProduct === idProduct)) {
      throw AppException.from(
        APP_ERRORS.production.duplicatedOutputExtra,
        undefined,
      );
    }
    const product = await this.productRepository.findById(idStore, idProduct);
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }
    if (!PRODUCIBLE_INPUT_KINDS.includes(product.kind)) {
      throw AppException.from(APP_ERRORS.production.inputNotInsumo, undefined);
    }
    return this.orderRepository.addOutputExtra(idProductionOrder, {
      idProductionOrderOutput,
      idProduct,
      productName: product.name,
      quantity,
    });
  }

  async removeOutputExtra(
    userId: string,
    idStore: string,
    idProductionOrder: string,
    idProductionOrderOutput: string,
    idProductionOrderOutputExtra: string,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);
    return this.orderRepository.removeOutputExtra(
      idProductionOrder,
      idProductionOrderOutput,
      idProductionOrderOutputExtra,
    );
  }

  // Drops one shared consumption line from a draft — for when the operator
  // realizes an insumo shouldn't be part of this specific batch, without
  // having to re-sync the whole order from the recipe (which would also
  // reset every other line back to the recipe's own quantities). At least
  // one item must remain: an order with zero inputs can't be completed.
  async removeItem(
    userId: string,
    idStore: string,
    idProductionOrder: string,
    idProductionOrderItem: string,
  ): Promise<ProductionOrderView> {
    await this.assertRegister(userId, idStore);
    const order = await loadProductionOrderOrFail(
      this.orderRepository,
      idStore,
      idProductionOrder,
    );
    assertDraft(order);
    const exists = order.items.some(
      (item) => item.idProductionOrderItem === idProductionOrderItem,
    );
    if (!exists) {
      throw AppException.from(
        APP_ERRORS.production.orderItemNotFound,
        undefined,
      );
    }
    if (order.items.length <= 1) {
      throw AppException.from(
        APP_ERRORS.production.cannotRemoveLastItem,
        undefined,
      );
    }
    return this.orderRepository.removeOrderItem(
      idProductionOrder,
      idProductionOrderItem,
    );
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
