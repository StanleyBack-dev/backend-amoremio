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
  type AddProductionOrderOutputExtraPayload,
  type AddProductionOrderOutputPayload,
  type CompleteProductionOrderPayload,
  type CreateProductionOrderPayload,
  type DuplicateProductionOrderPayload,
  type ListProductionOrdersFilters,
  type ProductionOrderFilterOptions,
  type ProductionOrderItemView,
  type ProductionOrderOutputExtraView,
  type ProductionOrderOutputView,
  type ProductionOrderRepositoryPort,
  type ProductionOrderView,
  type UpdateProductionOrderPayload,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";
import { RecipeEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe.entity";
import { RecipeItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe-item.entity";
import { ProductionOrderEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order.entity";
import { ProductionOrderItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order-item.entity";
import { ProductionOrderOutputEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order-output.entity";
import { ProductionOrderOutputExtraEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order-output-extra.entity";

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
    @InjectRepository(ProductionOrderOutputEntity)
    private readonly orderOutputRepository: Repository<ProductionOrderOutputEntity>,
    @InjectRepository(ProductionOrderOutputExtraEntity)
    private readonly orderOutputExtraRepository: Repository<ProductionOrderOutputExtraEntity>,
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

  async deleteRecipe(idRecipe: string): Promise<void> {
    // No FK/cascade between the two tables — delete the child rows first,
    // both inside one transaction so a failure never leaves the recipe
    // gone but its items behind (or vice versa).
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RecipeItemEntity, { idRecipe });
      await manager.delete(RecipeEntity, { idRecipe });
    });
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

  // Same shape as createOrder, plus the output/extra rows — all inside one
  // transaction so the client gets a single round-trip instead of the
  // create + N outputs + M extras it would otherwise take one at a time.
  async duplicateOrder(
    payload: DuplicateProductionOrderPayload,
  ): Promise<ProductionOrderView> {
    const idProductionOrder = await this.dataSource.transaction(
      async (manager) => {
        const order = await manager.save(
          manager.create(ProductionOrderEntity, {
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

        if (payload.items.length > 0) {
          await manager.save(
            payload.items.map((item) =>
              manager.create(ProductionOrderItemEntity, {
                idProductionOrder: order.idProductionOrder,
                idProduct: item.idProduct,
                productName: item.productName,
                quantity: item.quantity.toFixed(3),
                unit: item.unit,
              }),
            ),
          );
        }

        for (const output of payload.outputs) {
          const savedOutput = await manager.save(
            manager.create(ProductionOrderOutputEntity, {
              idProductionOrder: order.idProductionOrder,
              idProduct: output.idProduct,
              productName: output.productName,
              quantity: output.quantity.toFixed(3),
              unitCost: "0",
            }),
          );
          if (output.extras.length > 0) {
            await manager.save(
              output.extras.map((extra) =>
                manager.create(ProductionOrderOutputExtraEntity, {
                  idProductionOrderOutput: savedOutput.idProductionOrderOutput,
                  idProduct: extra.idProduct,
                  productName: extra.productName,
                  quantity: extra.quantity.toFixed(3),
                  unitCostAtConsumption: "0",
                  lineCost: "0",
                }),
              ),
            );
          }
        }

        return order.idProductionOrder;
      },
    );

    return this.loadOrderView(idProductionOrder);
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
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(ProductionOrderEntity);
      const itemRepo = manager.getRepository(ProductionOrderItemEntity);
      const outputRepo = manager.getRepository(ProductionOrderOutputEntity);
      const outputExtraRepo = manager.getRepository(
        ProductionOrderOutputExtraEntity,
      );

      const order = await orderRepo.findOneOrFail({
        where: { idProductionOrder: payload.idProductionOrder },
      });
      order.status = ProductionOrderStatus.CONCLUIDA;
      order.inputsCost = payload.inputsCost.toFixed(4);
      order.totalCost = payload.totalCost.toFixed(4);
      order.outputUnitCost = payload.outputUnitCost.toFixed(4);
      order.actualOutputQuantity = payload.actualOutputQuantity.toFixed(3);
      order.concludedAt = payload.concludedAt;
      await orderRepo.save(order);

      for (const frozen of payload.items) {
        await itemRepo.update(
          { idProductionOrderItem: frozen.idProductionOrderItem },
          {
            unitCostAtConsumption: frozen.unitCostAtConsumption.toFixed(6),
            lineCost: frozen.lineCost.toFixed(4),
          },
        );
      }

      for (const output of payload.outputs) {
        await outputRepo.update(
          { idProductionOrderOutput: output.idProductionOrderOutput },
          { unitCost: output.unitCost.toFixed(6) },
        );
        for (const extra of output.extras) {
          await outputExtraRepo.update(
            {
              idProductionOrderOutputExtra: extra.idProductionOrderOutputExtra,
            },
            {
              unitCostAtConsumption: extra.unitCostAtConsumption.toFixed(6),
              lineCost: extra.lineCost.toFixed(4),
            },
          );
        }
      }
    });

    return this.loadOrderView(payload.idProductionOrder);
  }

  async addOutput(
    payload: AddProductionOrderOutputPayload,
  ): Promise<ProductionOrderView> {
    await this.orderOutputRepository.save(
      this.orderOutputRepository.create({
        idProductionOrder: payload.idProductionOrder,
        idProduct: payload.idProduct,
        productName: payload.productName,
        quantity: payload.quantity.toFixed(3),
        unitCost: "0",
      }),
    );
    return this.loadOrderView(payload.idProductionOrder);
  }

  async removeOutput(
    idProductionOrder: string,
    idProductionOrderOutput: string,
  ): Promise<ProductionOrderView> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(ProductionOrderOutputExtraEntity, {
        idProductionOrderOutput,
      });
      await manager.delete(ProductionOrderOutputEntity, {
        idProductionOrderOutput,
        idProductionOrder,
      });
    });
    return this.loadOrderView(idProductionOrder);
  }

  async addOutputExtra(
    idProductionOrder: string,
    payload: AddProductionOrderOutputExtraPayload,
  ): Promise<ProductionOrderView> {
    await this.orderOutputExtraRepository.save(
      this.orderOutputExtraRepository.create({
        idProductionOrderOutput: payload.idProductionOrderOutput,
        idProduct: payload.idProduct,
        productName: payload.productName,
        quantity: payload.quantity.toFixed(3),
        unitCostAtConsumption: "0",
        lineCost: "0",
      }),
    );
    return this.loadOrderView(idProductionOrder);
  }

  async removeOutputExtra(
    idProductionOrder: string,
    idProductionOrderOutput: string,
    idProductionOrderOutputExtra: string,
  ): Promise<ProductionOrderView> {
    await this.orderOutputExtraRepository.delete({
      idProductionOrderOutputExtra,
      idProductionOrderOutput,
    });
    return this.loadOrderView(idProductionOrder);
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

    const idProductionOrders = rows.map((row) => row.idProductionOrder);
    const [items, outputs, creatorNames] = await Promise.all([
      this.orderItemRepository.find({
        where: { idProductionOrder: In(idProductionOrders) },
        order: { createdAt: "ASC" },
      }),
      this.loadOutputsForOrders(idProductionOrders),
      this.resolveCreatorNames(rows.map((row) => row.createdByUserId)),
    ]);
    const itemsByOrder = groupBy(items, (item) => item.idProductionOrder);

    return {
      records: rows.map((row) =>
        this.mapOrderView(
          row,
          itemsByOrder.get(row.idProductionOrder) ?? [],
          outputs.get(row.idProductionOrder) ?? [],
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
    const [items, outputsByOrder] = await Promise.all([
      this.orderItemRepository.find({
        where: { idProductionOrder },
        order: { createdAt: "ASC" },
      }),
      this.loadOutputsForOrders([idProductionOrder]),
    ]);
    const creatorName =
      (await this.resolveCreatorNames([order.createdByUserId])).get(
        order.createdByUserId,
      ) ?? null;
    return this.mapOrderView(
      order,
      items,
      outputsByOrder.get(idProductionOrder) ?? [],
      creatorName,
    );
  }

  // One round-trip for the output lines, one for their extras, grouped by
  // production order and then by output line.
  private async loadOutputsForOrders(
    idProductionOrders: string[],
  ): Promise<Map<string, ProductionOrderOutputView[]>> {
    const result = new Map<string, ProductionOrderOutputView[]>();
    if (idProductionOrders.length === 0) return result;

    const outputs = await this.orderOutputRepository.find({
      where: { idProductionOrder: In(idProductionOrders) },
      order: { createdAt: "ASC" },
    });
    if (outputs.length === 0) return result;

    const extras = await this.orderOutputExtraRepository.find({
      where: {
        idProductionOrderOutput: In(
          outputs.map((output) => output.idProductionOrderOutput),
        ),
      },
      order: { createdAt: "ASC" },
    });
    const extrasByOutput = groupBy(
      extras,
      (extra) => extra.idProductionOrderOutput,
    );

    for (const output of outputs) {
      const view: ProductionOrderOutputView = {
        idProductionOrderOutput: output.idProductionOrderOutput,
        idProduct: output.idProduct,
        productName: output.productName,
        quantity: Number(output.quantity),
        unitCost: Number(output.unitCost),
        extras: (extrasByOutput.get(output.idProductionOrderOutput) ?? []).map(
          (extra): ProductionOrderOutputExtraView => ({
            idProductionOrderOutputExtra: extra.idProductionOrderOutputExtra,
            idProduct: extra.idProduct,
            productName: extra.productName,
            quantity: Number(extra.quantity),
            unitCostAtConsumption: Number(extra.unitCostAtConsumption),
            lineCost: Number(extra.lineCost),
          }),
        ),
      };
      const list = result.get(output.idProductionOrder) ?? [];
      list.push(view);
      result.set(output.idProductionOrder, list);
    }
    return result;
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
    outputs: ProductionOrderOutputView[],
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
      outputs,
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
