import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  type AddShoppingListItemPayload,
  type AddShoppingListItemsPayload,
  type CreateShoppingListPayload,
  type ListShoppingListsFilters,
  type ShoppingListItemView,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
  type UpdateShoppingListItemPayload,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";
import { ShoppingListEntity } from "@/modules/shopping-list/infrastructure/persistence/typeorm/entities/shopping-list.entity";
import { ShoppingListItemEntity } from "@/modules/shopping-list/infrastructure/persistence/typeorm/entities/shopping-list-item.entity";

@Injectable()
export class ShoppingListTypeormRepository implements ShoppingListRepositoryPort {
  constructor(
    @InjectRepository(ShoppingListEntity)
    private readonly listRepository: Repository<ShoppingListEntity>,
    @InjectRepository(ShoppingListItemEntity)
    private readonly itemRepository: Repository<ShoppingListItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateShoppingListPayload): Promise<ShoppingListView> {
    const saved = await this.listRepository.save(
      this.listRepository.create({
        idStore: payload.idStore,
        name: payload.name,
        notes: payload.notes,
        status: ShoppingListStatus.ABERTA,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.loadView(saved.idShoppingList);
  }

  async findById(
    idStore: string,
    idShoppingList: string,
  ): Promise<ShoppingListView | null> {
    const list = await this.listRepository.findOne({
      where: { idShoppingList, idStore },
    });
    if (!list) {
      return null;
    }
    return this.loadView(list.idShoppingList);
  }

  async findByConvertedPurchaseId(
    idStore: string,
    idPurchase: string,
  ): Promise<ShoppingListView | null> {
    const list = await this.listRepository.findOne({
      where: { idStore, convertedToPurchaseId: idPurchase },
    });
    if (!list) {
      return null;
    }
    return this.loadView(list.idShoppingList);
  }

  async listByStore(
    idStore: string,
    filters?: ListShoppingListsFilters,
  ): Promise<{ records: ShoppingListView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.listRepository
      .createQueryBuilder("list")
      .where("list.idStore = :idStore", { idStore });

    if (filters?.status) {
      query.andWhere("list.status = :status", { status: filters.status });
    }

    if (filters?.createdByUserId) {
      query.andWhere("list.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    const [rows, total] = await query
      .orderBy("list.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return { records: [], total };
    }

    const items = await this.itemRepository.find({
      where: { idShoppingList: In(rows.map((row) => row.idShoppingList)) },
      order: { createdAt: "ASC" },
    });
    const itemsByList = new Map<string, ShoppingListItemEntity[]>();
    for (const item of items) {
      const current = itemsByList.get(item.idShoppingList) ?? [];
      current.push(item);
      itemsByList.set(item.idShoppingList, current);
    }

    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapView(
          row,
          itemsByList.get(row.idShoppingList) ?? [],
          creatorNames.get(row.createdByUserId) ?? null,
        ),
      ),
      total,
    };
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

  private async resolveCreatorName(id: string): Promise<string | null> {
    return (await this.resolveCreatorNames([id])).get(id) ?? null;
  }

  async addItem(
    payload: AddShoppingListItemPayload,
  ): Promise<ShoppingListView> {
    await this.getOrFail(payload.idShoppingList);
    await this.itemRepository.save(
      this.itemRepository.create({
        idShoppingList: payload.idShoppingList,
        idProduct: payload.idProduct,
        productName: payload.productName,
        unit: payload.unit,
        desiredQuantity: payload.desiredQuantity.toFixed(3),
        note: payload.note,
      }),
    );
    return this.loadView(payload.idShoppingList);
  }

  async addItems(
    payload: AddShoppingListItemsPayload,
  ): Promise<ShoppingListView> {
    await this.getOrFail(payload.idShoppingList);
    // The use-case already validated the whole batch — one bulk insert
    // instead of a row-at-a-time save.
    await this.itemRepository.insert(
      payload.items.map((item) => ({
        idShoppingList: payload.idShoppingList,
        idProduct: item.idProduct,
        productName: item.productName,
        unit: item.unit,
        desiredQuantity: item.desiredQuantity.toFixed(3),
        note: item.note,
      })),
    );
    return this.loadView(payload.idShoppingList);
  }

  async updateItem(
    payload: UpdateShoppingListItemPayload,
  ): Promise<ShoppingListView> {
    const item = await this.itemRepository.findOne({
      where: {
        idShoppingListItem: payload.idShoppingListItem,
        idShoppingList: payload.idShoppingList,
      },
    });
    if (!item) {
      throw AppException.from(APP_ERRORS.shoppingList.itemNotFound, undefined);
    }

    if (payload.desiredQuantity !== undefined)
      item.desiredQuantity = payload.desiredQuantity.toFixed(3);
    if (payload.note !== undefined) item.note = payload.note;
    if (payload.purchased !== undefined) item.purchased = payload.purchased;

    await this.itemRepository.save(item);
    return this.loadView(payload.idShoppingList);
  }

  async removeItem(
    idShoppingList: string,
    idShoppingListItem: string,
  ): Promise<ShoppingListView> {
    await this.itemRepository.delete({ idShoppingListItem, idShoppingList });
    return this.loadView(idShoppingList);
  }

  async setStatus(
    idShoppingList: string,
    status: ShoppingListStatus,
  ): Promise<ShoppingListView> {
    const list = await this.getOrFail(idShoppingList);
    list.status = status;
    await this.listRepository.save(list);
    return this.loadView(idShoppingList);
  }

  async markConverted(
    idShoppingList: string,
    idPurchase: string,
    convertedAt: Date,
  ): Promise<ShoppingListView> {
    const list = await this.getOrFail(idShoppingList);
    list.status = ShoppingListStatus.CONVERTIDA;
    list.convertedToPurchaseId = idPurchase;
    list.convertedAt = convertedAt;
    await this.listRepository.save(list);
    return this.loadView(idShoppingList);
  }

  private async getOrFail(idShoppingList: string): Promise<ShoppingListEntity> {
    const list = await this.listRepository.findOne({
      where: { idShoppingList },
    });
    if (!list) {
      throw AppException.from(APP_ERRORS.shoppingList.notFound, undefined);
    }
    return list;
  }

  private async loadView(idShoppingList: string): Promise<ShoppingListView> {
    const list = await this.getOrFail(idShoppingList);
    const items = await this.itemRepository.find({
      where: { idShoppingList },
      order: { createdAt: "ASC" },
    });
    return this.mapView(
      list,
      items,
      await this.resolveCreatorName(list.createdByUserId),
    );
  }

  private mapView(
    entity: ShoppingListEntity,
    items: ShoppingListItemEntity[],
    creatorName: string | null = null,
  ): ShoppingListView {
    return {
      idShoppingList: entity.idShoppingList,
      idStore: entity.idStore,
      name: entity.name ?? null,
      status: entity.status,
      notes: entity.notes ?? null,
      convertedToPurchaseId: entity.convertedToPurchaseId ?? null,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      convertedAt: entity.convertedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: items.map((item) => this.mapItemView(item)),
    };
  }

  private mapItemView(entity: ShoppingListItemEntity): ShoppingListItemView {
    return {
      idShoppingListItem: entity.idShoppingListItem,
      idProduct: entity.idProduct,
      productName: entity.productName,
      unit: entity.unit,
      desiredQuantity: Number(entity.desiredQuantity),
      note: entity.note ?? null,
      purchased: entity.purchased,
    };
  }
}
