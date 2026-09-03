import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  type AddSalesOrderItemPayload,
  type ConfirmSalesOrderPayload,
  type CreateSalesOrderPayload,
  type ListSalesOrdersFilters,
  type SalesOrderFilterOptions,
  type SalesOrderItemView,
  type SalesOrderRepositoryPort,
  type SalesOrderView,
  type UpdateSalesOrderHeaderPayload,
  type UpdateSalesOrderItemPayload,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";
import { SalesOrderEntity } from "@/modules/sales/infrastructure/persistence/typeorm/entities/sales-order.entity";
import { SalesOrderItemEntity } from "@/modules/sales/infrastructure/persistence/typeorm/entities/sales-order-item.entity";

@Injectable()
export class SalesOrderTypeormRepository implements SalesOrderRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SalesOrderEntity)
    private readonly orderRepository: Repository<SalesOrderEntity>,
    @InjectRepository(SalesOrderItemEntity)
    private readonly itemRepository: Repository<SalesOrderItemEntity>,
  ) {}

  async create(payload: CreateSalesOrderPayload): Promise<SalesOrderView> {
    const saved = await this.orderRepository.save(
      this.orderRepository.create({
        idStore: payload.idStore,
        customerName: payload.customerName,
        orderDate: payload.orderDate,
        salesChannel: payload.salesChannel,
        notes: payload.notes,
        status: SalesOrderStatus.ABERTA,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.loadView(saved.idSalesOrder);
  }

  async findById(
    idStore: string,
    idSalesOrder: string,
  ): Promise<SalesOrderView | null> {
    const order = await this.orderRepository.findOne({
      where: { idSalesOrder, idStore },
    });
    return order ? this.loadView(order.idSalesOrder) : null;
  }

  async listByStore(
    idStore: string,
    filters?: ListSalesOrdersFilters,
  ): Promise<{ records: SalesOrderView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.orderRepository
      .createQueryBuilder("order")
      .where("order.idStore = :idStore", { idStore });

    if (filters?.status) {
      query.andWhere("order.status = :status", { status: filters.status });
    }
    if (filters?.customerName) {
      query.andWhere("order.customerName = :customerName", {
        customerName: filters.customerName.trim(),
      });
    }
    if (filters?.salesChannel) {
      query.andWhere("order.salesChannel = :salesChannel", {
        salesChannel: filters.salesChannel,
      });
    }
    if (filters?.createdByUserId) {
      query.andWhere("order.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    const [rows, total] = await query
      .orderBy("order.orderDate", "DESC")
      .addOrderBy("order.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return { records: [], total };
    }

    const items = await this.itemRepository.find({
      where: { idSalesOrder: In(rows.map((row) => row.idSalesOrder)) },
      order: { createdAt: "ASC" },
    });
    const byOrder = new Map<string, SalesOrderItemEntity[]>();
    for (const item of items) {
      const current = byOrder.get(item.idSalesOrder) ?? [];
      current.push(item);
      byOrder.set(item.idSalesOrder, current);
    }

    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapView(
          row,
          byOrder.get(row.idSalesOrder) ?? [],
          creatorNames.get(row.createdByUserId) ?? null,
        ),
      ),
      total,
    };
  }

  async updateHeader(
    payload: UpdateSalesOrderHeaderPayload,
  ): Promise<SalesOrderView> {
    const order = await this.getOrFail(payload.idSalesOrder);

    if (payload.customerName !== undefined)
      order.customerName = payload.customerName;
    if (payload.orderDate !== undefined) order.orderDate = payload.orderDate;
    if (payload.salesChannel !== undefined)
      order.salesChannel = payload.salesChannel;
    if (payload.commissionPercent !== undefined)
      order.commissionPercent = payload.commissionPercent.toFixed(2);
    if (payload.discountAmount !== undefined)
      order.discountAmount = payload.discountAmount.toFixed(2);
    if (payload.discountMode !== undefined)
      order.discountMode = payload.discountMode;
    if (payload.discountPercent !== undefined)
      order.discountPercent = payload.discountPercent.toFixed(2);
    if (payload.notes !== undefined) order.notes = payload.notes;

    await this.orderRepository.save(order);
    await this.recomputeSubtotal(order.idSalesOrder);
    return this.loadView(order.idSalesOrder);
  }

  async addItem(payload: AddSalesOrderItemPayload): Promise<SalesOrderView> {
    await this.getOrFail(payload.idSalesOrder);
    await this.itemRepository.save(
      this.itemRepository.create({
        idSalesOrder: payload.idSalesOrder,
        idProduct: payload.idProduct,
        productName: payload.productName,
        productKind: payload.productKind,
        quantity: payload.quantity.toFixed(3),
        unitPrice: payload.unitPrice.toFixed(2),
        lineTotal: payload.lineTotal.toFixed(2),
      }),
    );
    await this.recomputeSubtotal(payload.idSalesOrder);
    return this.loadView(payload.idSalesOrder);
  }

  async updateItem(
    payload: UpdateSalesOrderItemPayload,
  ): Promise<SalesOrderView> {
    const item = await this.itemRepository.findOne({
      where: {
        idSalesOrderItem: payload.idSalesOrderItem,
        idSalesOrder: payload.idSalesOrder,
      },
    });
    if (!item) {
      throw AppException.from(APP_ERRORS.sales.itemNotFound, undefined);
    }

    if (payload.quantity !== undefined)
      item.quantity = payload.quantity.toFixed(3);
    if (payload.unitPrice !== undefined)
      item.unitPrice = payload.unitPrice.toFixed(2);
    if (payload.lineTotal !== undefined)
      item.lineTotal = payload.lineTotal.toFixed(2);

    await this.itemRepository.save(item);
    await this.recomputeSubtotal(payload.idSalesOrder);
    return this.loadView(payload.idSalesOrder);
  }

  async removeItem(
    idSalesOrder: string,
    idSalesOrderItem: string,
  ): Promise<SalesOrderView> {
    await this.itemRepository.delete({ idSalesOrderItem, idSalesOrder });
    await this.recomputeSubtotal(idSalesOrder);
    return this.loadView(idSalesOrder);
  }

  async setStatus(
    idSalesOrder: string,
    status: SalesOrderStatus,
  ): Promise<SalesOrderView> {
    const order = await this.getOrFail(idSalesOrder);
    order.status = status;
    await this.orderRepository.save(order);
    return this.loadView(idSalesOrder);
  }

  async confirm(payload: ConfirmSalesOrderPayload): Promise<SalesOrderView> {
    const order = await this.getOrFail(payload.idSalesOrder);
    order.status = SalesOrderStatus.CONFIRMADA;
    order.itemsSubtotal = payload.itemsSubtotal.toFixed(2);
    order.discountAmount = payload.discountAmount.toFixed(2);
    order.total = payload.total.toFixed(2);
    order.commissionPercent = payload.commissionPercent.toFixed(2);
    order.commissionAmount = payload.commissionAmount.toFixed(2);
    order.netTotal = payload.netTotal.toFixed(2);
    order.confirmedAt = payload.confirmedAt;
    await this.orderRepository.save(order);
    return this.loadView(payload.idSalesOrder);
  }

  private async getOrFail(idSalesOrder: string): Promise<SalesOrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { idSalesOrder },
    });
    if (!order) {
      throw AppException.from(APP_ERRORS.sales.notFound, undefined);
    }
    return order;
  }

  private async recomputeSubtotal(idSalesOrder: string): Promise<void> {
    const items = await this.itemRepository.find({ where: { idSalesOrder } });
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );
    const order = await this.getOrFail(idSalesOrder);

    // A percentage discount tracks the subtotal; a flat one is used as typed.
    // The effective amount is frozen back onto discountAmount either way.
    const effectiveDiscount =
      order.discountMode === SalesDiscountMode.PERCENTUAL
        ? Math.round(
            subtotal * (Number(order.discountPercent) / 100) * 100,
          ) / 100
        : Number(order.discountAmount);

    const total = Math.max(subtotal - effectiveDiscount, 0);
    const pct = Math.min(Math.max(Number(order.commissionPercent), 0), 100);
    const commission = Math.round(((total * pct) / 100) * 100) / 100;

    order.discountAmount = Math.max(effectiveDiscount, 0).toFixed(2);
    order.itemsSubtotal = subtotal.toFixed(2);
    order.total = total.toFixed(2);
    order.commissionAmount = commission.toFixed(2);
    order.netTotal = (total - commission).toFixed(2);
    await this.orderRepository.save(order);
  }

  private async loadView(idSalesOrder: string): Promise<SalesOrderView> {
    const order = await this.getOrFail(idSalesOrder);
    const items = await this.itemRepository.find({
      where: { idSalesOrder },
      order: { createdAt: "ASC" },
    });
    return this.mapView(
      order,
      items,
      await this.resolveCreatorName(order.createdByUserId),
    );
  }

  async listFilterOptions(idStore: string): Promise<SalesOrderFilterOptions> {
    const rows = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.customerName", "customerName")
      .addSelect("order.salesChannel", "salesChannel")
      .addSelect("order.createdByUserId", "createdByUserId")
      .where("order.idStore = :idStore", { idStore })
      .getRawMany<{
        customerName: string | null;
        salesChannel: SalesChannel;
        createdByUserId: string;
      }>();

    const customers = Array.from(
      new Set(
        rows.map((row) => row.customerName).filter((v): v is string => !!v),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const channels = Array.from(
      new Set(rows.map((row) => row.salesChannel).filter(Boolean)),
    );

    const creatorIds = Array.from(
      new Set(rows.map((row) => row.createdByUserId).filter(Boolean)),
    );
    const creatorNames = await this.resolveCreatorNames(creatorIds);
    const creators = creatorIds
      .map((id) => ({ id, name: creatorNames.get(id) ?? "—" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return { customers, channels, creators };
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

  private mapView(
    entity: SalesOrderEntity,
    items: SalesOrderItemEntity[],
    creatorName: string | null = null,
  ): SalesOrderView {
    return {
      idSalesOrder: entity.idSalesOrder,
      idStore: entity.idStore,
      customerName: entity.customerName ?? null,
      orderDate: entity.orderDate,
      status: entity.status,
      salesChannel: entity.salesChannel,
      commissionPercent: Number(entity.commissionPercent),
      commissionAmount: Number(entity.commissionAmount),
      netTotal: Number(entity.netTotal),
      discountAmount: Number(entity.discountAmount),
      discountMode: entity.discountMode,
      discountPercent: Number(entity.discountPercent),
      itemsSubtotal: Number(entity.itemsSubtotal),
      total: Number(entity.total),
      notes: entity.notes ?? null,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      confirmedAt: entity.confirmedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: items.map((item) => this.mapItemView(item)),
    };
  }

  private mapItemView(entity: SalesOrderItemEntity): SalesOrderItemView {
    return {
      idSalesOrderItem: entity.idSalesOrderItem,
      idProduct: entity.idProduct,
      productName: entity.productName,
      productKind: entity.productKind,
      quantity: Number(entity.quantity),
      unitPrice: Number(entity.unitPrice),
      lineTotal: Number(entity.lineTotal),
    };
  }
}
