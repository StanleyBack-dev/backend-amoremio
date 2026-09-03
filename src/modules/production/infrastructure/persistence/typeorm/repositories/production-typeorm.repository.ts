import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  type AddRecipeItemPayload,
  type AddRecipeItemsPayload,
  type CreateRecipePayload,
  type ListRecipesFilters,
  type RecipeItemView,
  type RecipeRepositoryPort,
  type RecipeView,
  type UpdateRecipeItemPayload,
  type UpdateRecipePayload,
} from "@/modules/production/application/ports/recipe-repository.port";
import {
  type CompleteProductionOrderPayload,
  type CreateProductionOrderPayload,
  type ListProductionOrdersFilters,
  type ProductionOrderFilterOptions,
  type ProductionOrderItemView,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
  type UpdateProductionOrderPayload,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import { RecipeEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe.entity";
import { RecipeItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe-item.entity";
import { ProductionOrderEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order.entity";
import { ProductionOrderItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order-item.entity";

@Injectable()
export class ProductionTypeormRepository
  implements RecipeRepositoryPort, ProductionOrderRepositoryPort
{
  constructor(
    @InjectRepository(RecipeEntity)
    private readonly recipeRepository: Repository<RecipeEntity>,
    @InjectRepository(RecipeItemEntity)
    private readonly recipeItemRepository: Repository<RecipeItemEntity>,
    @InjectRepository(ProductionOrderEntity)
    private readonly orderRepository: Repository<ProductionOrderEntity>,
    @InjectRepository(ProductionOrderItemEntity)
    private readonly orderItemRepository: Repository<ProductionOrderItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // --- Recipes -------------------------------------------------------------

  async createRecipe(payload: CreateRecipePayload): Promise<RecipeView> {
    const saved = await this.recipeRepository.save(
      this.recipeRepository.create({
        idStore: payload.idStore,
        idOutputProduct: payload.idOutputProduct,
        outputProductName: payload.outputProductName,
        name: payload.name,
        yieldQuantity: payload.yieldQuantity.toFixed(3),
        yieldUnit: payload.yieldUnit,
        laborCost: payload.laborCost.toFixed(2),
        overheadCost: payload.overheadCost.toFixed(2),
        status: true,
        notes: payload.notes,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.loadRecipeView(saved.idRecipe);
  }

  async findRecipeById(
    idStore: string,
    idRecipe: string,
  ): Promise<RecipeView | null> {
    const recipe = await this.recipeRepository.findOne({
      where: { idRecipe, idStore },
    });
    return recipe ? this.loadRecipeView(recipe.idRecipe) : null;
  }

  async findRecipeByOutputProduct(
    idStore: string,
    idOutputProduct: string,
  ): Promise<RecipeView | null> {
    const recipe = await this.recipeRepository.findOne({
      where: { idStore, idOutputProduct },
    });
    return recipe ? this.loadRecipeView(recipe.idRecipe) : null;
  }

  async listRecipesByStore(
    idStore: string,
    filters?: ListRecipesFilters,
  ): Promise<{ records: RecipeView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.recipeRepository
      .createQueryBuilder("recipe")
      .where("recipe.idStore = :idStore", { idStore });

    if (filters?.status !== undefined) {
      query.andWhere("recipe.status = :status", { status: filters.status });
    }

    const [rows, total] = await query
      .orderBy("recipe.name", "ASC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return { records: [], total };
    }

    const items = await this.recipeItemRepository.find({
      where: { idRecipe: In(rows.map((row) => row.idRecipe)) },
      order: { createdAt: "ASC" },
    });
    const itemsByRecipe = groupBy(items, (item) => item.idRecipe);
    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapRecipeView(
          row,
          itemsByRecipe.get(row.idRecipe) ?? [],
          creatorNames.get(row.createdByUserId) ?? null,
        ),
      ),
      total,
    };
  }

  async updateRecipe(payload: UpdateRecipePayload): Promise<RecipeView> {
    const recipe = await this.getRecipeOrFail(payload.idRecipe);
    if (payload.name !== undefined) recipe.name = payload.name;
    if (payload.yieldQuantity !== undefined)
      recipe.yieldQuantity = payload.yieldQuantity.toFixed(3);
    if (payload.laborCost !== undefined)
      recipe.laborCost = payload.laborCost.toFixed(2);
    if (payload.overheadCost !== undefined)
      recipe.overheadCost = payload.overheadCost.toFixed(2);
    if (payload.status !== undefined) recipe.status = payload.status;
    if (payload.notes !== undefined) recipe.notes = payload.notes;
    await this.recipeRepository.save(recipe);
    return this.loadRecipeView(payload.idRecipe);
  }

  async addRecipeItem(payload: AddRecipeItemPayload): Promise<RecipeView> {
    await this.getRecipeOrFail(payload.idRecipe);
    await this.recipeItemRepository.save(
      this.recipeItemRepository.create({
        idRecipe: payload.idRecipe,
        idProduct: payload.idProduct,
        productName: payload.productName,
        quantity: payload.quantity.toFixed(3),
        unit: payload.unit,
      }),
    );
    return this.loadRecipeView(payload.idRecipe);
  }

  async addRecipeItems(payload: AddRecipeItemsPayload): Promise<RecipeView> {
    // The use case already loaded and validated the recipe; one bulk insert
    // instead of a row-at-a-time save.
    await this.recipeItemRepository.insert(
      payload.items.map((item) => ({
        idRecipe: payload.idRecipe,
        idProduct: item.idProduct,
        productName: item.productName,
        quantity: item.quantity.toFixed(3),
        unit: item.unit,
      })),
    );
    return this.loadRecipeView(payload.idRecipe);
  }

  async updateRecipeItem(
    payload: UpdateRecipeItemPayload,
  ): Promise<RecipeView> {
    const item = await this.recipeItemRepository.findOne({
      where: {
        idRecipeItem: payload.idRecipeItem,
        idRecipe: payload.idRecipe,
      },
    });
    if (!item) {
      throw AppException.from(
        APP_ERRORS.production.recipeItemNotFound,
        undefined,
      );
    }
    item.quantity = payload.quantity.toFixed(3);
    await this.recipeItemRepository.save(item);
    return this.loadRecipeView(payload.idRecipe);
  }

  async removeRecipeItem(
    idRecipe: string,
    idRecipeItem: string,
  ): Promise<RecipeView> {
    await this.recipeItemRepository.delete({ idRecipeItem, idRecipe });
    return this.loadRecipeView(idRecipe);
  }

  // --- Production orders --------------------------------------------------

  async createOrder(
    payload: CreateProductionOrderPayload,
  ): Promise<ProductionOrderView> {
    const saved = await this.orderRepository.save(
      this.orderRepository.create({
        idStore: payload.idStore,
        idRecipe: payload.idRecipe,
        recipeName: payload.recipeName,
        idOutputProduct: payload.idOutputProduct,
        outputProductName: payload.outputProductName,
        productionDate: payload.productionDate,
        status: ProductionOrderStatus.RASCUNHO,
        batches: payload.batches.toFixed(3),
        plannedOutputQuantity: payload.plannedOutputQuantity.toFixed(3),
        actualOutputQuantity: payload.actualOutputQuantity.toFixed(3),
        laborCost: payload.laborCost.toFixed(2),
        overheadCost: payload.overheadCost.toFixed(2),
        notes: payload.notes,
        createdByUserId: payload.createdByUserId,
      }),
    );
    await this.replaceOrderItems(saved.idProductionOrder, payload.items);
    return this.loadOrderView(saved.idProductionOrder);
  }

  async findOrderById(
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView | null> {
    const order = await this.orderRepository.findOne({
      where: { idProductionOrder, idStore },
    });
    return order ? this.loadOrderView(order.idProductionOrder) : null;
  }

  async setOrderStatus(
    idProductionOrder: string,
    status: ProductionOrderStatus,
  ): Promise<ProductionOrderView> {
    const order = await this.getOrderOrFail(idProductionOrder);
    order.status = status;
    await this.orderRepository.save(order);
    return this.loadOrderView(idProductionOrder);
  }

  async completeOrder(
    payload: CompleteProductionOrderPayload,
  ): Promise<ProductionOrderView> {
    const order = await this.getOrderOrFail(payload.idProductionOrder);
    order.status = ProductionOrderStatus.CONCLUIDA;
    order.inputsCost = payload.inputsCost.toFixed(4);
    order.totalCost = payload.totalCost.toFixed(4);
    order.outputUnitCost = payload.outputUnitCost.toFixed(4);
    order.actualOutputQuantity = payload.actualOutputQuantity.toFixed(3);
    order.concludedAt = payload.concludedAt;
    await this.orderRepository.save(order);

    for (const frozen of payload.items) {
      await this.orderItemRepository.update(
        { idProductionOrderItem: frozen.idProductionOrderItem },
        {
          unitCostAtConsumption: frozen.unitCostAtConsumption.toFixed(6),
          lineCost: frozen.lineCost.toFixed(4),
        },
      );
    }

    return this.loadOrderView(payload.idProductionOrder);
  }

  async listOrdersByStore(
    idStore: string,
    filters?: ListProductionOrdersFilters,
  ): Promise<{ records: ProductionOrderView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.orderRepository
      .createQueryBuilder("order")
      .where("order.idStore = :idStore", { idStore });

    if (filters?.status) {
      query.andWhere("order.status = :status", { status: filters.status });
    }

    if (filters?.idRecipe) {
      query.andWhere("order.idRecipe = :idRecipe", {
        idRecipe: filters.idRecipe,
      });
    }

    if (filters?.createdByUserId) {
      query.andWhere("order.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    const [rows, total] = await query
      .orderBy("order.productionDate", "DESC")
      .addOrderBy("order.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return { records: [], total };
    }

    const items = await this.orderItemRepository.find({
      where: {
        idProductionOrder: In(rows.map((row) => row.idProductionOrder)),
      },
      order: { createdAt: "ASC" },
    });
    const itemsByOrder = groupBy(items, (item) => item.idProductionOrder);
    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapOrderView(
          row,
          itemsByOrder.get(row.idProductionOrder) ?? [],
          creatorNames.get(row.createdByUserId) ?? null,
        ),
      ),
      total,
    };
  }

  async listOrderFilterOptions(
    idStore: string,
  ): Promise<ProductionOrderFilterOptions> {
    const rows = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.idRecipe", "idRecipe")
      .addSelect("order.recipeName", "recipeName")
      .addSelect("order.createdByUserId", "createdByUserId")
      .where("order.idStore = :idStore", { idStore })
      .getRawMany<{
        idRecipe: string;
        recipeName: string;
        createdByUserId: string;
      }>();

    const recipeMap = new Map<string, string>();
    for (const row of rows) {
      if (row.idRecipe && !recipeMap.has(row.idRecipe)) {
        recipeMap.set(row.idRecipe, row.recipeName);
      }
    }
    const recipes = Array.from(recipeMap, ([id, name]) => ({ id, name })).sort(
      (a, b) => a.name.localeCompare(b.name, "pt-BR"),
    );

    const creatorIds = Array.from(
      new Set(rows.map((row) => row.createdByUserId).filter(Boolean)),
    );
    const creatorNames = await this.resolveCreatorNames(creatorIds);
    const creators = creatorIds
      .map((id) => ({ id, name: creatorNames.get(id) ?? "—" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return { recipes, creators };
  }

  async updateOrder(
    payload: UpdateProductionOrderPayload,
  ): Promise<ProductionOrderView> {
    const order = await this.getOrderOrFail(payload.idProductionOrder);
    if (payload.productionDate !== undefined)
      order.productionDate = payload.productionDate;
    if (payload.batches !== undefined)
      order.batches = payload.batches.toFixed(3);
    if (payload.plannedOutputQuantity !== undefined)
      order.plannedOutputQuantity = payload.plannedOutputQuantity.toFixed(3);
    if (payload.actualOutputQuantity !== undefined)
      order.actualOutputQuantity = payload.actualOutputQuantity.toFixed(3);
    if (payload.laborCost !== undefined)
      order.laborCost = payload.laborCost.toFixed(2);
    if (payload.overheadCost !== undefined)
      order.overheadCost = payload.overheadCost.toFixed(2);
    if (payload.notes !== undefined) order.notes = payload.notes;
    await this.orderRepository.save(order);

    if (payload.items !== undefined) {
      await this.replaceOrderItems(payload.idProductionOrder, payload.items);
    }

    return this.loadOrderView(payload.idProductionOrder);
  }

  // --- helpers ----------------------------------------------------------

  private async replaceOrderItems(
    idProductionOrder: string,
    items: {
      idProduct: string;
      productName: string;
      quantity: number;
      unit: string;
    }[],
  ): Promise<void> {
    await this.orderItemRepository.delete({ idProductionOrder });
    if (items.length === 0) return;
    await this.orderItemRepository.save(
      items.map((item) =>
        this.orderItemRepository.create({
          idProductionOrder,
          idProduct: item.idProduct,
          productName: item.productName,
          quantity: item.quantity.toFixed(3),
          unit: item.unit,
        }),
      ),
    );
  }

  private async getRecipeOrFail(idRecipe: string): Promise<RecipeEntity> {
    const recipe = await this.recipeRepository.findOne({ where: { idRecipe } });
    if (!recipe) {
      throw AppException.from(APP_ERRORS.production.recipeNotFound, undefined);
    }
    return recipe;
  }

  private async getOrderOrFail(
    idProductionOrder: string,
  ): Promise<ProductionOrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { idProductionOrder },
    });
    if (!order) {
      throw AppException.from(APP_ERRORS.production.orderNotFound, undefined);
    }
    return order;
  }

  private async loadRecipeView(idRecipe: string): Promise<RecipeView> {
    const [recipe, items] = await Promise.all([
      this.getRecipeOrFail(idRecipe),
      this.recipeItemRepository.find({
        where: { idRecipe },
        order: { createdAt: "ASC" },
      }),
    ]);
    const creatorName =
      (await this.resolveCreatorNames([recipe.createdByUserId])).get(
        recipe.createdByUserId,
      ) ?? null;
    return this.mapRecipeView(recipe, items, creatorName);
  }

  private async loadOrderView(
    idProductionOrder: string,
  ): Promise<ProductionOrderView> {
    const order = await this.getOrderOrFail(idProductionOrder);
    const items = await this.orderItemRepository.find({
      where: { idProductionOrder },
      order: { createdAt: "ASC" },
    });
    const creatorName =
      (await this.resolveCreatorNames([order.createdByUserId])).get(
        order.createdByUserId,
      ) ?? null;
    return this.mapOrderView(order, items, creatorName);
  }

  private async resolveCreatorNames(
    ids: Array<string | null | undefined>,
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(
      new Set(ids.filter((id): id is string => !!id)),
    );
    if (uniqueIds.length === 0) return new Map();
    const users = await this.dataSource
      .getRepository(UserEntity)
      .find({ where: { idUsers: In(uniqueIds) }, select: ["idUsers", "name"] });
    return new Map(users.map((user) => [user.idUsers, user.name]));
  }

  private mapRecipeView(
    entity: RecipeEntity,
    items: RecipeItemEntity[],
    creatorName: string | null,
  ): RecipeView {
    return {
      idRecipe: entity.idRecipe,
      idStore: entity.idStore,
      idOutputProduct: entity.idOutputProduct,
      outputProductName: entity.outputProductName,
      name: entity.name,
      yieldQuantity: Number(entity.yieldQuantity),
      yieldUnit: entity.yieldUnit,
      laborCost: Number(entity.laborCost),
      overheadCost: Number(entity.overheadCost),
      status: entity.status,
      notes: entity.notes ?? null,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: items.map((item) => this.mapRecipeItemView(item)),
    };
  }

  private mapRecipeItemView(entity: RecipeItemEntity): RecipeItemView {
    return {
      idRecipeItem: entity.idRecipeItem,
      idProduct: entity.idProduct,
      productName: entity.productName,
      quantity: Number(entity.quantity),
      unit: entity.unit,
    };
  }

  private mapOrderView(
    entity: ProductionOrderEntity,
    items: ProductionOrderItemEntity[],
    creatorName: string | null,
  ): ProductionOrderView {
    return {
      idProductionOrder: entity.idProductionOrder,
      idStore: entity.idStore,
      idRecipe: entity.idRecipe,
      recipeName: entity.recipeName,
      idOutputProduct: entity.idOutputProduct,
      outputProductName: entity.outputProductName,
      productionDate: entity.productionDate,
      status: entity.status,
      batches: Number(entity.batches),
      plannedOutputQuantity: Number(entity.plannedOutputQuantity),
      actualOutputQuantity: Number(entity.actualOutputQuantity),
      laborCost: Number(entity.laborCost),
      overheadCost: Number(entity.overheadCost),
      inputsCost: Number(entity.inputsCost),
      totalCost: Number(entity.totalCost),
      outputUnitCost: Number(entity.outputUnitCost),
      notes: entity.notes ?? null,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      concludedAt: entity.concludedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: items.map((item) => this.mapOrderItemView(item)),
    };
  }

  private mapOrderItemView(
    entity: ProductionOrderItemEntity,
  ): ProductionOrderItemView {
    return {
      idProductionOrderItem: entity.idProductionOrderItem,
      idProduct: entity.idProduct,
      productName: entity.productName,
      quantity: Number(entity.quantity),
      unit: entity.unit,
      unitCostAtConsumption: Number(entity.unitCostAtConsumption),
      lineCost: Number(entity.lineCost),
    };
  }
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const current = map.get(k) ?? [];
    current.push(row);
    map.set(k, current);
  }
  return map;
}
