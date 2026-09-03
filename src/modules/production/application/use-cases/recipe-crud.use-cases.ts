import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import {
  PRODUCIBLE_INPUT_KINDS,
  PRODUCIBLE_OUTPUT_KINDS,
  ProductKind,
} from "@/modules/catalog/domain/enums/product-kind.enum";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  RECIPE_REPOSITORY,
  type RecipeRepositoryPort,
  type RecipeView,
} from "@/modules/production/application/ports/recipe-repository.port";
import {
  AddRecipeItemCommand,
  AddRecipeItemsCommand,
  CreateRecipeCommand,
  ListRecipesQuery,
  UpdateRecipeCommand,
  UpdateRecipeItemCommand,
} from "@/modules/production/application/dto/production.commands";
import { loadRecipeOrFail } from "@/modules/production/application/use-cases/production-access.helper";

export interface PaginatedRecipes {
  items: RecipeView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class RecipeCrudUseCases {
  constructor(
    @Inject(RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  private assertManage(userId: string, idStore: string) {
    return this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.MANAGE_RECIPES,
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
    command: CreateRecipeCommand,
  ): Promise<RecipeView> {
    await this.assertManage(userId, command.idStore);

    const output = await this.productRepository.findById(
      command.idStore,
      command.idOutputProduct,
    );
    if (!output) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }
    if (!PRODUCIBLE_OUTPUT_KINDS.includes(output.kind)) {
      throw AppException.from(
        APP_ERRORS.production.outputNotFinishedGood,
        undefined,
      );
    }

    const existing = await this.recipeRepository.findRecipeByOutputProduct(
      command.idStore,
      command.idOutputProduct,
    );
    if (existing) {
      throw AppException.from(
        APP_ERRORS.production.duplicatedRecipe,
        undefined,
      );
    }

    const yieldQuantity = Number(command.yieldQuantity);
    if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidYield, undefined);
    }

    return this.recipeRepository.createRecipe({
      idStore: command.idStore,
      idOutputProduct: output.idProduct,
      outputProductName: output.name,
      name: (command.name ?? "").trim() || output.name,
      yieldQuantity,
      yieldUnit: output.unit,
      laborCost: Math.max(command.laborCost ?? 0, 0),
      overheadCost: Math.max(command.overheadCost ?? 0, 0),
      notes: (command.notes ?? "").trim() || null,
      createdByUserId: userId,
    });
  }

  async list(
    userId: string,
    query: ListRecipesQuery,
  ): Promise<PaginatedRecipes> {
    await this.assertView(userId, query.idStore);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.recipeRepository.listRecipesByStore(
      query.idStore,
      { page, limit, status: query.status },
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

  async getById(
    userId: string,
    idStore: string,
    idRecipe: string,
  ): Promise<RecipeView> {
    await this.assertView(userId, idStore);
    return loadRecipeOrFail(this.recipeRepository, idStore, idRecipe);
  }

  async update(
    userId: string,
    command: UpdateRecipeCommand,
  ): Promise<RecipeView> {
    await this.assertManage(userId, command.idStore);
    await loadRecipeOrFail(
      this.recipeRepository,
      command.idStore,
      command.idRecipe,
    );

    let yieldQuantity: number | undefined;
    if (command.yieldQuantity !== undefined) {
      yieldQuantity = Number(command.yieldQuantity);
      if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) {
        throw AppException.from(APP_ERRORS.production.invalidYield, undefined);
      }
    }

    return this.recipeRepository.updateRecipe({
      idRecipe: command.idRecipe,
      name:
        command.name !== undefined
          ? command.name.trim() || undefined
          : undefined,
      yieldQuantity,
      laborCost:
        command.laborCost !== undefined
          ? Math.max(command.laborCost, 0)
          : undefined,
      overheadCost:
        command.overheadCost !== undefined
          ? Math.max(command.overheadCost, 0)
          : undefined,
      status: command.status,
      notes:
        command.notes !== undefined
          ? (command.notes ?? "").trim() || null
          : undefined,
    });
  }

  async addItem(
    userId: string,
    command: AddRecipeItemCommand,
  ): Promise<RecipeView> {
    await this.assertManage(userId, command.idStore);
    const recipe = await loadRecipeOrFail(
      this.recipeRepository,
      command.idStore,
      command.idRecipe,
    );

    const item = await this.validateItemEntry(command.idStore, recipe, {
      idProduct: command.idProduct,
      quantity: command.quantity,
    });

    return this.recipeRepository.addRecipeItem({
      idRecipe: command.idRecipe,
      ...item,
    });
  }

  async addItems(
    userId: string,
    command: AddRecipeItemsCommand,
  ): Promise<RecipeView> {
    if (!command.items || command.items.length === 0) {
      throw AppException.from(APP_ERRORS.production.noItemsToAdd, undefined);
    }

    const [, recipe] = await Promise.all([
      this.assertManage(userId, command.idStore),
      loadRecipeOrFail(
        this.recipeRepository,
        command.idStore,
        command.idRecipe,
      ),
    ]);

    // Load every referenced product in one query instead of one per entry,
    // then validate against the in-memory list — this batch can hold a dozen
    // ingredients and the round-trips add up against a remote database.
    const requestedIds = [
      ...new Set(command.items.map((entry) => entry.idProduct)),
    ];
    const products = await this.productRepository.findManyByIds(
      command.idStore,
      requestedIds,
    );
    const productById = new Map(products.map((p) => [p.idProduct, p]));

    // Validate every entry before touching the database, so the batch is
    // all-or-nothing from the caller's point of view.
    const items: Array<{
      idProduct: string;
      productName: string;
      quantity: number;
      unit: string;
    }> = [];
    const seen = new Set<string>();
    for (const entry of command.items) {
      const product = productById.get(entry.idProduct);
      if (!product) {
        throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
      }
      const item = await this.assertEntryValid(
        command.idStore,
        recipe,
        product,
        entry.quantity,
      );
      if (seen.has(item.idProduct)) {
        throw AppException.from(APP_ERRORS.production.duplicatedRecipeItem, {
          product: item.productName,
        });
      }
      seen.add(item.idProduct);
      items.push(item);
    }

    return this.recipeRepository.addRecipeItems({
      idRecipe: command.idRecipe,
      items,
    });
  }

  // Validates a single ingredient entry against the recipe and returns the
  // normalized payload (product snapshot + stock unit).
  private async validateItemEntry(
    idStore: string,
    recipe: RecipeView,
    entry: { idProduct: string; quantity: number },
  ): Promise<{
    idProduct: string;
    productName: string;
    quantity: number;
    unit: string;
  }> {
    const product = await this.productRepository.findById(
      idStore,
      entry.idProduct,
    );
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }
    return this.assertEntryValid(idStore, recipe, product, entry.quantity);
  }

  // The product-independent half of the validation, shared by the single-item
  // and batch paths (the batch loads all products up front).
  private async assertEntryValid(
    idStore: string,
    recipe: RecipeView,
    product: {
      idProduct: string;
      name: string;
      kind: ProductKind;
      unit: string;
    },
    rawQuantity: number,
  ): Promise<{
    idProduct: string;
    productName: string;
    quantity: number;
    unit: string;
  }> {
    if (!PRODUCIBLE_INPUT_KINDS.includes(product.kind)) {
      throw AppException.from(APP_ERRORS.production.inputNotInsumo, undefined);
    }
    // The same product can only appear once — quantity is edited on the
    // existing line instead of adding a second row.
    if (recipe.items.some((item) => item.idProduct === product.idProduct)) {
      throw AppException.from(APP_ERRORS.production.duplicatedRecipeItem, {
        product: product.name,
      });
    }

    // An intermediate ingredient must not depend (transitively) on this
    // recipe's own output — that would loop forever at production time.
    if (product.kind === ProductKind.INTERMEDIARIO) {
      const cycles = await this.dependsOn(
        idStore,
        product.idProduct,
        recipe.idOutputProduct,
      );
      if (cycles) {
        throw AppException.from(APP_ERRORS.production.recipeCycle, {
          product: product.name,
        });
      }
    }

    const quantity = Number(rawQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }

    return {
      idProduct: product.idProduct,
      productName: product.name,
      quantity,
      unit: product.unit,
    };
  }

  async updateItem(
    userId: string,
    command: UpdateRecipeItemCommand,
  ): Promise<RecipeView> {
    await this.assertManage(userId, command.idStore);
    const recipe = await loadRecipeOrFail(
      this.recipeRepository,
      command.idStore,
      command.idRecipe,
    );
    const item = recipe.items.find(
      (row) => row.idRecipeItem === command.idRecipeItem,
    );
    if (!item) {
      throw AppException.from(
        APP_ERRORS.production.recipeItemNotFound,
        undefined,
      );
    }

    const quantity = Number(command.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw AppException.from(APP_ERRORS.production.invalidQuantity, undefined);
    }

    return this.recipeRepository.updateRecipeItem({
      idRecipe: command.idRecipe,
      idRecipeItem: command.idRecipeItem,
      quantity,
    });
  }

  async removeItem(
    userId: string,
    idStore: string,
    idRecipe: string,
    idRecipeItem: string,
  ): Promise<RecipeView> {
    await this.assertManage(userId, idStore);
    await loadRecipeOrFail(this.recipeRepository, idStore, idRecipe);
    return this.recipeRepository.removeRecipeItem(idRecipe, idRecipeItem);
  }

  // Walks the recipe tree under `startProductId` and returns true if it
  // (transitively) consumes `targetProductId`. Only intermediates have
  // recipes, so the walk is naturally bounded by the intermediate depth.
  private async dependsOn(
    idStore: string,
    startProductId: string,
    targetProductId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    const stack: string[] = [startProductId];
    while (stack.length > 0) {
      const productId = stack.pop() as string;
      if (productId === targetProductId) return true;
      if (visited.has(productId)) continue;
      visited.add(productId);
      const recipe = await this.recipeRepository.findRecipeByOutputProduct(
        idStore,
        productId,
      );
      if (!recipe) continue;
      for (const item of recipe.items) stack.push(item.idProduct);
    }
    return false;
  }
}
