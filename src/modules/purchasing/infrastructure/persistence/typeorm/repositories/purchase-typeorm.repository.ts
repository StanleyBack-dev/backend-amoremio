import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  type AddPurchaseItemPayload,
  type CreatePurchasePayload,
  type FinalizePurchasePayload,
  type ListPurchasesFilters,
  type PurchaseFilterOptions,
  type PurchaseItemView,
  type PurchaseRepositoryPort,
  type PurchaseView,
  type UpdatePurchaseHeaderPayload,
  type UpdatePurchaseItemPayload,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";
import { PurchaseEntity } from "@/modules/purchasing/infrastructure/persistence/typeorm/entities/purchase.entity";
import { PurchaseItemEntity } from "@/modules/purchasing/infrastructure/persistence/typeorm/entities/purchase-item.entity";

@Injectable()
export class PurchaseTypeormRepository implements PurchaseRepositoryPort {
  constructor(
    @InjectRepository(PurchaseEntity)
    private readonly purchaseRepository: Repository<PurchaseEntity>,
    @InjectRepository(PurchaseItemEntity)
    private readonly itemRepository: Repository<PurchaseItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreatePurchasePayload): Promise<PurchaseView> {
    const saved = await this.purchaseRepository.save(
      this.purchaseRepository.create({
        idStore: payload.idStore,
        supplierName: payload.supplierName,
        purchaseDate: payload.purchaseDate,
        notes: payload.notes,
        status: PurchaseStatus.RASCUNHO,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.loadView(saved.idPurchase);
  }

  async findById(
    idStore: string,
    idPurchase: string,
  ): Promise<PurchaseView | null> {
    const purchase = await this.purchaseRepository.findOne({
      where: { idPurchase, idStore },
    });
    if (!purchase) {
      return null;
    }
    return this.loadView(purchase.idPurchase);
  }

  async listByStore(
    idStore: string,
    filters?: ListPurchasesFilters,
  ): Promise<{ records: PurchaseView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.purchaseRepository
      .createQueryBuilder("purchase")
      .where("purchase.idStore = :idStore", { idStore });

    if (filters?.status) {
      query.andWhere("purchase.status = :status", { status: filters.status });
    }

    if (filters?.supplierName) {
      query.andWhere("purchase.supplierName = :supplierName", {
        supplierName: filters.supplierName.trim(),
      });
    }

    if (filters?.createdByUserId) {
      query.andWhere("purchase.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    const [rows, total] = await query
      .orderBy("purchase.purchaseDate", "DESC")
      .addOrderBy("purchase.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return { records: [], total };
    }

    const items = await this.itemRepository.find({
      where: { idPurchase: In(rows.map((row) => row.idPurchase)) },
      order: { createdAt: "ASC" },
    });
    const itemsByPurchase = new Map<string, PurchaseItemEntity[]>();
    for (const item of items) {
      const current = itemsByPurchase.get(item.idPurchase) ?? [];
      current.push(item);
      itemsByPurchase.set(item.idPurchase, current);
    }

    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapView(
          row,
          itemsByPurchase.get(row.idPurchase) ?? [],
          creatorNames.get(row.createdByUserId) ?? null,
        ),
      ),
      total,
    };
  }

  async listFilterOptions(idStore: string): Promise<PurchaseFilterOptions> {
    const rows = await this.purchaseRepository
      .createQueryBuilder("purchase")
      .select("purchase.supplierName", "supplierName")
      .addSelect("purchase.createdByUserId", "createdByUserId")
      .where("purchase.idStore = :idStore", { idStore })
      .getRawMany<{ supplierName: string | null; createdByUserId: string }>();

    const suppliers = Array.from(
      new Set(
        rows.map((row) => row.supplierName).filter((v): v is string => !!v),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const creatorIds = Array.from(
      new Set(rows.map((row) => row.createdByUserId).filter(Boolean)),
    );
    const creatorNames = await this.resolveCreatorNames(creatorIds);
    const creators = creatorIds
      .map((id) => ({ id, name: creatorNames.get(id) ?? "—" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return { suppliers, creators };
  }

  // Resolves user ids to display names in a single batched query.
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

  async updateHeader(
    payload: UpdatePurchaseHeaderPayload,
  ): Promise<PurchaseView> {
    const purchase = await this.getOrFail(payload.idPurchase);

    if (payload.supplierName !== undefined)
      purchase.supplierName = payload.supplierName;
    if (payload.purchaseDate !== undefined)
      purchase.purchaseDate = payload.purchaseDate;
    if (payload.freightAmount !== undefined)
      purchase.freightAmount = payload.freightAmount.toFixed(2);
    if (payload.discountAmount !== undefined)
      purchase.discountAmount = payload.discountAmount.toFixed(2);
    if (payload.discountMode !== undefined)
      purchase.discountMode = payload.discountMode;
    if (payload.discountPercent !== undefined)
      purchase.discountPercent = payload.discountPercent.toFixed(2);
    if (payload.notes !== undefined) purchase.notes = payload.notes;

    await this.purchaseRepository.save(purchase);
    // Totals are only re-derived while the purchase is a draft — a finalized
    // one has them frozen (already credited to stock). A supplier/notes edit
    // on a finalized purchase must not touch the numbers.
    if (purchase.status === PurchaseStatus.RASCUNHO) {
      await this.recomputeSubtotal(purchase.idPurchase);
    }
    return this.loadView(purchase.idPurchase);
  }

  async addItem(payload: AddPurchaseItemPayload): Promise<PurchaseView> {
    await this.getOrFail(payload.idPurchase);
    await this.itemRepository.save(
      this.itemRepository.create({
        idPurchase: payload.idPurchase,
        idProduct: payload.idProduct,
        productName: payload.productName,
        purchasedQuantity: payload.purchasedQuantity.toFixed(3),
        purchasedUnit: payload.purchasedUnit,
        conversionFactor: payload.conversionFactor.toFixed(4),
        unitPrice: payload.unitPrice.toFixed(2),
        lineTotal: payload.lineTotal.toFixed(2),
      }),
    );
    await this.recomputeSubtotal(payload.idPurchase);
    return this.loadView(payload.idPurchase);
  }

  async updateItem(payload: UpdatePurchaseItemPayload): Promise<PurchaseView> {
    const item = await this.itemRepository.findOne({
      where: {
        idPurchaseItem: payload.idPurchaseItem,
        idPurchase: payload.idPurchase,
      },
    });
    if (!item) {
      throw AppException.from(APP_ERRORS.purchasing.itemNotFound, undefined);
    }

    if (payload.purchasedQuantity !== undefined)
      item.purchasedQuantity = payload.purchasedQuantity.toFixed(3);
    if (payload.purchasedUnit !== undefined)
      item.purchasedUnit = payload.purchasedUnit;
    if (payload.conversionFactor !== undefined)
      item.conversionFactor = payload.conversionFactor.toFixed(4);
    if (payload.unitPrice !== undefined)
      item.unitPrice = payload.unitPrice.toFixed(2);
    if (payload.lineTotal !== undefined)
      item.lineTotal = payload.lineTotal.toFixed(2);

    await this.itemRepository.save(item);
    await this.recomputeSubtotal(payload.idPurchase);
    return this.loadView(payload.idPurchase);
  }

  async removeItem(
    idPurchase: string,
    idPurchaseItem: string,
  ): Promise<PurchaseView> {
    await this.itemRepository.delete({ idPurchaseItem, idPurchase });
    await this.recomputeSubtotal(idPurchase);
    return this.loadView(idPurchase);
  }

  async setStatus(
    idPurchase: string,
    status: PurchaseStatus,
  ): Promise<PurchaseView> {
    const purchase = await this.getOrFail(idPurchase);
    purchase.status = status;
    await this.purchaseRepository.save(purchase);
    return this.loadView(idPurchase);
  }

  async finalize(payload: FinalizePurchasePayload): Promise<PurchaseView> {
    const purchase = await this.getOrFail(payload.idPurchase);
    purchase.status = PurchaseStatus.FINALIZADA;
    purchase.itemsSubtotal = payload.itemsSubtotal.toFixed(2);
    purchase.total = payload.total.toFixed(2);
    purchase.freightAmount = payload.freightAmount.toFixed(2);
    purchase.discountAmount = payload.discountAmount.toFixed(2);
    purchase.finalizedAt = payload.finalizedAt;
    await this.purchaseRepository.save(purchase);

    for (const frozen of payload.items) {
      await this.itemRepository.update(
        { idPurchaseItem: frozen.idPurchaseItem },
        {
          baseQuantity: frozen.baseQuantity.toFixed(4),
          effectiveUnitCost: frozen.effectiveUnitCost.toFixed(6),
        },
      );
    }

    return this.loadView(payload.idPurchase);
  }

  private async getOrFail(idPurchase: string): Promise<PurchaseEntity> {
    const purchase = await this.purchaseRepository.findOne({
      where: { idPurchase },
    });
    if (!purchase) {
      throw AppException.from(APP_ERRORS.purchasing.notFound, undefined);
    }
    return purchase;
  }

  private async recomputeSubtotal(idPurchase: string): Promise<void> {
    const items = await this.itemRepository.find({ where: { idPurchase } });
    const subtotal =
      Math.round(
        items.reduce((sum, item) => sum + Number(item.lineTotal), 0) * 100,
      ) / 100;
    const purchase = await this.getOrFail(idPurchase);

    const effectiveDiscount =
      purchase.discountMode === PurchaseDiscountMode.PERCENTUAL
        ? Math.round(
            subtotal * (Number(purchase.discountPercent) / 100) * 100,
          ) / 100
        : Number(purchase.discountAmount);

    const total = subtotal + Number(purchase.freightAmount) - effectiveDiscount;
    purchase.discountAmount = Math.max(effectiveDiscount, 0).toFixed(2);
    purchase.itemsSubtotal = subtotal.toFixed(2);
    purchase.total = Math.max(total, 0).toFixed(2);
    await this.purchaseRepository.save(purchase);
  }

  private async loadView(idPurchase: string): Promise<PurchaseView> {
    const purchase = await this.getOrFail(idPurchase);
    const items = await this.itemRepository.find({
      where: { idPurchase },
      order: { createdAt: "ASC" },
    });
    return this.mapView(
      purchase,
      items,
      await this.resolveCreatorName(purchase.createdByUserId),
    );
  }

  private mapView(
    entity: PurchaseEntity,
    items: PurchaseItemEntity[],
    creatorName: string | null = null,
  ): PurchaseView {
    return {
      idPurchase: entity.idPurchase,
      idStore: entity.idStore,
      supplierName: entity.supplierName ?? null,
      purchaseDate: entity.purchaseDate,
      status: entity.status,
      freightAmount: Number(entity.freightAmount),
      discountAmount: Number(entity.discountAmount),
      discountMode: entity.discountMode,
      discountPercent: Number(entity.discountPercent),
      itemsSubtotal: Number(entity.itemsSubtotal),
      total: Number(entity.total),
      notes: entity.notes ?? null,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      finalizedAt: entity.finalizedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: items.map((item) => this.mapItemView(item)),
    };
  }

  private mapItemView(entity: PurchaseItemEntity): PurchaseItemView {
    return {
      idPurchaseItem: entity.idPurchaseItem,
      idProduct: entity.idProduct,
      productName: entity.productName,
      purchasedQuantity: Number(entity.purchasedQuantity),
      purchasedUnit: entity.purchasedUnit,
      conversionFactor: Number(entity.conversionFactor),
      unitPrice: Number(entity.unitPrice),
      lineTotal: Number(entity.lineTotal),
      baseQuantity: Number(entity.baseQuantity),
      effectiveUnitCost: Number(entity.effectiveUnitCost),
    };
  }
}
