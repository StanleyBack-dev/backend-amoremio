import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
  type CurrentStock,
  type InventoryRepositoryPort,
  type ListStockMovementsFilters,
  type ListStoreStockFilters,
  type PersistStockMovementInput,
  type StockItemView,
  type StockMovementView,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";
import { ProductEntity } from "@/modules/catalog/infrastructure/persistence/typeorm/entities/product.entity";
import { StockItemEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-item.entity";
import { StockMovementEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-movement.entity";

@Injectable()
export class InventoryTypeormRepository implements InventoryRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StockItemEntity)
    private readonly stockItemRepository: Repository<StockItemEntity>,
    @InjectRepository(StockMovementEntity)
    private readonly movementRepository: Repository<StockMovementEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async getCurrentStock(
    idStore: string,
    idProduct: string,
  ): Promise<CurrentStock | null> {
    const item = await this.stockItemRepository.findOne({
      where: { idStore, idProduct },
    });
    if (!item) {
      return null;
    }
    return {
      quantityOnHand: Number(item.quantityOnHand),
      averageCost: Number(item.averageCost),
    };
  }

  async getCurrentStockBatch(
    idStore: string,
    idProductIds: string[],
  ): Promise<Map<string, CurrentStock>> {
    const result = new Map<string, CurrentStock>();
    if (idProductIds.length === 0) {
      return result;
    }
    const items = await this.stockItemRepository.find({
      where: { idStore, idProduct: In(idProductIds) },
    });
    for (const item of items) {
      result.set(item.idProduct, {
        quantityOnHand: Number(item.quantityOnHand),
        averageCost: Number(item.averageCost),
      });
    }
    return result;
  }

  async findExistingProductIds(
    idStore: string,
    idProductIds: string[],
  ): Promise<Set<string>> {
    if (idProductIds.length === 0) {
      return new Set();
    }
    const rows = await this.productRepository.find({
      select: { idProduct: true },
      where: { idStore, idProduct: In(idProductIds) },
    });
    return new Set(rows.map((row) => row.idProduct));
  }

  async persistMovementsBatch(
    inputs: PersistStockMovementInput[],
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      const stockItemRepository = manager.getRepository(StockItemEntity);
      const movementRepository = manager.getRepository(StockMovementEntity);

      // The last movement for each product carries its final snapshot.
      const finalByProduct = new Map<string, PersistStockMovementInput>();
      for (const input of inputs) {
        finalByProduct.set(input.idProduct, input);
      }

      const productIds = [...finalByProduct.keys()];
      const existing = await stockItemRepository.find({
        where: { idProduct: In(productIds) },
      });
      const existingByProduct = new Map(
        existing.map((item) => [item.idProduct, item]),
      );

      const itemsToSave = [...finalByProduct.values()].map((input) => {
        const row =
          existingByProduct.get(input.idProduct) ??
          stockItemRepository.create({ idProduct: input.idProduct });
        row.idStore = input.idStore;
        row.quantityOnHand = input.resultingQuantity.toFixed(3);
        row.averageCost = input.resultingAverageCost.toFixed(6);
        return row;
      });
      await stockItemRepository.save(itemsToSave);

      await movementRepository.insert(
        inputs.map((input) => ({
          idStore: input.idStore,
          idProduct: input.idProduct,
          type: input.type,
          quantity: input.quantity.toFixed(3),
          unitCost: input.unitCost.toFixed(6),
          resultingQuantity: input.resultingQuantity.toFixed(3),
          resultingAverageCost: input.resultingAverageCost.toFixed(6),
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          note: input.note,
          createdByUserId: input.createdByUserId,
          occurredAt: input.occurredAt,
        })),
      );
    });
  }

  async persistMovement(input: PersistStockMovementInput): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const stockItemRepository = manager.getRepository(StockItemEntity);
      const existing = await stockItemRepository.findOne({
        where: { idProduct: input.idProduct },
      });

      if (existing) {
        existing.idStore = input.idStore;
        existing.quantityOnHand = input.resultingQuantity.toFixed(3);
        existing.averageCost = input.resultingAverageCost.toFixed(6);
        await stockItemRepository.save(existing);
      } else {
        await stockItemRepository.save(
          stockItemRepository.create({
            idProduct: input.idProduct,
            idStore: input.idStore,
            quantityOnHand: input.resultingQuantity.toFixed(3),
            averageCost: input.resultingAverageCost.toFixed(6),
          }),
        );
      }

      await manager.getRepository(StockMovementEntity).save(
        manager.getRepository(StockMovementEntity).create({
          idStore: input.idStore,
          idProduct: input.idProduct,
          type: input.type,
          quantity: input.quantity.toFixed(3),
          unitCost: input.unitCost.toFixed(6),
          resultingQuantity: input.resultingQuantity.toFixed(3),
          resultingAverageCost: input.resultingAverageCost.toFixed(6),
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          note: input.note,
          createdByUserId: input.createdByUserId,
          occurredAt: input.occurredAt,
        }),
      );
    });
  }

  async getStockItem(
    idStore: string,
    idProduct: string,
  ): Promise<StockItemView | null> {
    const product = await this.productRepository.findOne({
      where: { idProduct, idStore },
    });
    if (!product) {
      return null;
    }

    const item = await this.stockItemRepository.findOne({
      where: { idProduct, idStore },
    });

    return this.mapItemView(product, item ?? null);
  }

  async listStoreStock(
    idStore: string,
    filters?: ListStoreStockFilters,
  ): Promise<{
    records: StockItemView[];
    total: number;
    valueTotal: number;
  }> {
    const query = this.productRepository
      .createQueryBuilder("product")
      .where("product.idStore = :idStore", { idStore });

    if (filters?.name) {
      query.andWhere("product.name = :name", { name: filters.name.trim() });
    }
    if (filters?.withoutBrand) {
      query.andWhere("(product.brand IS NULL OR product.brand = '')");
    } else if (filters?.brand) {
      query.andWhere("product.brand = :brand", { brand: filters.brand.trim() });
    }
    if (filters?.kind) {
      query.andWhere("product.kind = :kind", { kind: filters.kind });
    }
    if (filters?.unit) {
      query.andWhere("product.unit = :unit", { unit: filters.unit });
    }
    if (filters?.status !== undefined) {
      query.andWhere("product.status = :status", { status: filters.status });
    }

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;

    // All product ids that match the filter (not just the page) — used for the
    // running "valor imobilizado" total.
    const allIds = (
      await query
        .clone()
        .select("product.idProduct", "id")
        .getRawMany<{ id: string }>()
    ).map((row) => row.id);

    const [products, total] = await query
      .orderBy("product.name", "ASC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let valueTotal = 0;
    if (allIds.length > 0) {
      const valueRow = await this.stockItemRepository
        .createQueryBuilder("item")
        .select("COALESCE(SUM(item.quantityOnHand * item.averageCost), 0)", "v")
        .where("item.idStore = :idStore", { idStore })
        .andWhere("item.idProduct IN (:...ids)", { ids: allIds })
        .getRawOne<{ v: string }>();
      valueTotal = Math.round(Number(valueRow?.v ?? 0) * 100) / 100;
    }

    if (products.length === 0) {
      return { records: [], total, valueTotal };
    }

    const items = await this.stockItemRepository.find({
      where: { idStore, idProduct: In(products.map((p) => p.idProduct)) },
    });
    const itemsByProduct = new Map(items.map((item) => [item.idProduct, item]));

    return {
      records: products.map((product) =>
        this.mapItemView(product, itemsByProduct.get(product.idProduct) ?? null),
      ),
      total,
      valueTotal,
    };
  }

  async listMovements(
    idStore: string,
    filters?: ListStockMovementsFilters,
  ): Promise<{ records: StockMovementView[]; total: number }> {
    const query = this.movementRepository
      .createQueryBuilder("movement")
      .where("movement.idStore = :idStore", { idStore });

    if (filters?.idProduct) {
      query.andWhere("movement.idProduct = :idProduct", {
        idProduct: filters.idProduct,
      });
    }
    if (filters?.type) {
      query.andWhere("movement.type = :type", { type: filters.type });
    }

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 15;

    const [movements, total] = await query
      .orderBy("movement.occurredAt", "DESC")
      .addOrderBy("movement.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (movements.length === 0) {
      return { records: [], total };
    }

    const productIds = [...new Set(movements.map((m) => m.idProduct))];
    const products = new Map(
      (
        await this.productRepository.find({
          where: { idProduct: In(productIds) },
        })
      ).map((product) => [
        product.idProduct,
        { name: product.name, unit: product.unit },
      ]),
    );

    return {
      records: movements.map((movement) => ({
        idStockMovement: movement.idStockMovement,
        idStore: movement.idStore,
        idProduct: movement.idProduct,
        productName: products.get(movement.idProduct)?.name ?? "—",
        unit: products.get(movement.idProduct)?.unit ?? UnitOfMeasure.UN,
        type: movement.type,
        quantity: Number(movement.quantity),
        unitCost: Number(movement.unitCost),
        resultingQuantity: Number(movement.resultingQuantity),
        resultingAverageCost: Number(movement.resultingAverageCost),
        sourceType: movement.sourceType ?? null,
        sourceId: movement.sourceId ?? null,
        note: movement.note ?? null,
        createdByUserId: movement.createdByUserId,
        occurredAt: movement.occurredAt,
      })),
      total,
    };
  }

  async setReorderPoint(
    idStore: string,
    idProduct: string,
    reorderPoint: number | null,
  ): Promise<void> {
    const existing = await this.stockItemRepository.findOne({
      where: { idStore, idProduct },
    });

    if (existing) {
      existing.reorderPoint =
        reorderPoint === null ? null : reorderPoint.toFixed(3);
      await this.stockItemRepository.save(existing);
      return;
    }

    await this.stockItemRepository.save(
      this.stockItemRepository.create({
        idProduct,
        idStore,
        quantityOnHand: "0",
        averageCost: "0",
        reorderPoint: reorderPoint === null ? null : reorderPoint.toFixed(3),
      }),
    );
  }

  private mapItemView(
    product: ProductEntity,
    item: StockItemEntity | null,
  ): StockItemView {
    const quantityOnHand = item ? Number(item.quantityOnHand) : 0;
    const averageCost = item ? Number(item.averageCost) : 0;

    return {
      idProduct: product.idProduct,
      idStore: product.idStore,
      productName: product.name,
      sku: product.sku ?? null,
      brand: product.brand ?? null,
      kind: product.kind,
      status: product.status,
      unit: product.unit,
      quantityOnHand,
      averageCost,
      stockValue: Number((quantityOnHand * averageCost).toFixed(2)),
      reorderPoint:
        item?.reorderPoint !== null && item?.reorderPoint !== undefined
          ? Number(item.reorderPoint)
          : null,
      updatedAt: item?.updatedAt ?? null,
    };
  }
}
