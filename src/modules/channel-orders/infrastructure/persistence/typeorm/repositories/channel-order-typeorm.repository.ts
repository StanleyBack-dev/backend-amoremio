import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  type ChannelEventItemView,
  type ChannelEventView,
  type ChannelOrderRepositoryPort,
  type ChannelStoreLinkView,
  type UnmappedChannelProductView,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { ChannelEventStatus } from "@/modules/channel-orders/domain/enums/channel-event-status.enum";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";
import { ChannelEventEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-event.entity";
import { ChannelEventItemEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-event-item.entity";
import { ChannelProductMappingEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-product-mapping.entity";
import { ChannelStoreLinkEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-store-link.entity";

@Injectable()
export class ChannelOrderTypeormRepository implements ChannelOrderRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChannelEventEntity)
    private readonly eventRepository: Repository<ChannelEventEntity>,
    @InjectRepository(ChannelEventItemEntity)
    private readonly itemRepository: Repository<ChannelEventItemEntity>,
    @InjectRepository(ChannelProductMappingEntity)
    private readonly mappingRepository: Repository<ChannelProductMappingEntity>,
    @InjectRepository(ChannelStoreLinkEntity)
    private readonly storeLinkRepository: Repository<ChannelStoreLinkEntity>,
  ) {}

  async findStoreIdByExternalShopId(
    channel: SalesChannel,
    externalShopId: string,
  ): Promise<string | null> {
    const link = await this.storeLinkRepository.findOne({
      where: { channel, externalShopId },
    });
    return link?.idStore ?? null;
  }

  async findStoreLink(
    idStore: string,
    channel: SalesChannel,
  ): Promise<ChannelStoreLinkView | null> {
    const link = await this.storeLinkRepository.findOne({
      where: { idStore, channel },
    });
    if (!link) return null;
    return {
      idStore: link.idStore,
      channel: link.channel,
      externalShopId: link.externalShopId,
      authToken: link.authToken ?? null,
      authTokenExpiresAt: link.authTokenExpiresAt ?? null,
    };
  }

  async saveStoreLinkToken(
    idStore: string,
    channel: SalesChannel,
    authToken: string,
    authTokenExpiresAt: Date,
  ): Promise<void> {
    await this.storeLinkRepository.update(
      { idStore, channel },
      { authToken, authTokenExpiresAt },
    );
  }

  async findEventByExternalOrderId(
    idStore: string,
    channel: SalesChannel,
    externalOrderId: string,
  ): Promise<ChannelEventView | null> {
    const event = await this.eventRepository.findOne({
      where: { idStore, channel, externalOrderId },
    });
    if (!event) return null;
    return this.loadView(event.idChannelEvent);
  }

  async findEventById(
    idChannelEvent: string,
  ): Promise<ChannelEventView | null> {
    const event = await this.eventRepository.findOne({
      where: { idChannelEvent },
    });
    return event ? this.loadView(idChannelEvent) : null;
  }

  async createEvent(order: ChannelOrder): Promise<ChannelEventView> {
    const externalProductIds = [
      ...new Set(order.items.map((item) => item.externalProductId)),
    ];
    const mappings = externalProductIds.length
      ? await this.mappingRepository.find({
          where: {
            idStore: order.idStore,
            channel: order.channel,
            externalProductId: In(externalProductIds),
          },
        })
      : [];
    const mappedProductByExternalId = new Map(
      mappings
        .filter((m) => m.idProduct)
        .map((m) => [m.externalProductId, m.idProduct as string]),
    );

    return this.dataSource.transaction(async (manager) => {
      const savedEvent = await manager.save(
        manager.create(ChannelEventEntity, {
          idStore: order.idStore,
          channel: order.channel,
          externalOrderId: order.externalOrderId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes ?? null,
          rawPayload: order.rawPayload,
          status: ChannelEventStatus.PENDING_MAPPING,
        }),
      );

      const items = order.items.map((item) =>
        manager.create(ChannelEventItemEntity, {
          idChannelEvent: savedEvent.idChannelEvent,
          externalProductId: item.externalProductId,
          externalProductName: item.externalProductName,
          quantity: item.quantity.toFixed(3),
          unitPrice: item.unitPrice.toFixed(2),
          idProduct:
            mappedProductByExternalId.get(item.externalProductId) ?? null,
        }),
      );
      const savedItems = await manager.save(items);

      return this.mapEventView(savedEvent, savedItems);
    });
  }

  async markEventImported(
    idChannelEvent: string,
    idSalesOrder: string,
  ): Promise<void> {
    await this.eventRepository.update(
      { idChannelEvent },
      { status: ChannelEventStatus.IMPORTED, idSalesOrder, errorDetail: null },
    );
  }

  async markEventFailed(
    idChannelEvent: string,
    errorDetail: string,
  ): Promise<void> {
    await this.eventRepository.update(
      { idChannelEvent },
      { status: ChannelEventStatus.FAILED, errorDetail },
    );
  }

  async upsertProductMapping(payload: {
    idStore: string;
    channel: SalesChannel;
    externalProductId: string;
    externalProductName: string;
    idProduct: string;
  }): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(ChannelProductMappingEntity, {
        where: {
          idStore: payload.idStore,
          channel: payload.channel,
          externalProductId: payload.externalProductId,
        },
      });

      if (existing) {
        existing.idProduct = payload.idProduct;
        existing.externalProductName = payload.externalProductName;
        await manager.save(existing);
      } else {
        await manager.save(
          manager.create(ChannelProductMappingEntity, {
            idStore: payload.idStore,
            channel: payload.channel,
            externalProductId: payload.externalProductId,
            externalProductName: payload.externalProductName,
            idProduct: payload.idProduct,
          }),
        );
      }

      // Backfill every event item still waiting on this external product —
      // this is what lets one mapping unblock every order that used it.
      await manager.query(
        `UPDATE tb_channel_event_items i
           SET "idtb_products" = $1
          FROM tb_channel_events e
         WHERE e."idtb_channel_events" = i."idtb_channel_events"
           AND e."idtb_stores" = $2
           AND e."channel" = $3
           AND i."external_product_id" = $4`,
        [
          payload.idProduct,
          payload.idStore,
          payload.channel,
          payload.externalProductId,
        ],
      );
    });
  }

  async listUnmappedProducts(
    idStore: string,
  ): Promise<UnmappedChannelProductView[]> {
    const rows = await this.itemRepository
      .createQueryBuilder("item")
      .innerJoin(
        ChannelEventEntity,
        "event",
        "event.idtb_channel_events = item.idtb_channel_events",
      )
      .select("event.channel", "channel")
      .addSelect("item.externalProductId", "external_product_id")
      .addSelect("item.externalProductName", "external_product_name")
      .addSelect(
        "COUNT(DISTINCT item.idtb_channel_events)",
        "pending_event_count",
      )
      .where("event.idtb_stores = :idStore", { idStore })
      .andWhere("event.status = :status", {
        status: ChannelEventStatus.PENDING_MAPPING,
      })
      .andWhere("item.idtb_products IS NULL")
      .groupBy("event.channel")
      .addGroupBy("item.externalProductId")
      .addGroupBy("item.externalProductName")
      .orderBy("pending_event_count", "DESC")
      .getRawMany<{
        channel: SalesChannel;
        external_product_id: string;
        external_product_name: string;
        pending_event_count: string;
      }>();

    return rows.map((row) => ({
      idStore,
      channel: row.channel,
      externalProductId: row.external_product_id,
      externalProductName: row.external_product_name,
      pendingEventCount: Number(row.pending_event_count),
    }));
  }

  async listPendingEventsByExternalProduct(
    idStore: string,
    channel: SalesChannel,
    externalProductId: string,
  ): Promise<ChannelEventView[]> {
    const events = await this.eventRepository
      .createQueryBuilder("event")
      .innerJoin(
        ChannelEventItemEntity,
        "item",
        "item.idtb_channel_events = event.idtb_channel_events AND item.external_product_id = :externalProductId",
        { externalProductId },
      )
      .where("event.idtb_stores = :idStore AND event.channel = :channel", {
        idStore,
        channel,
      })
      .andWhere("event.status = :status", {
        status: ChannelEventStatus.PENDING_MAPPING,
      })
      .getMany();

    return Promise.all(events.map((e) => this.loadView(e.idChannelEvent)));
  }

  private async loadView(idChannelEvent: string): Promise<ChannelEventView> {
    const event = await this.eventRepository.findOne({
      where: { idChannelEvent },
    });
    if (!event) {
      throw AppException.from(
        APP_ERRORS.channelOrders.eventNotFound,
        undefined,
      );
    }
    const items = await this.itemRepository.find({
      where: { idChannelEvent },
      order: { createdAt: "ASC" },
    });
    return this.mapEventView(event, items);
  }

  private mapEventView(
    event: ChannelEventEntity,
    items: ChannelEventItemEntity[],
  ): ChannelEventView {
    return {
      idChannelEvent: event.idChannelEvent,
      idStore: event.idStore,
      channel: event.channel,
      externalOrderId: event.externalOrderId,
      status: event.status,
      customerName: event.customerName,
      customerPhone: event.customerPhone ?? null,
      notes: event.notes ?? null,
      idSalesOrder: event.idSalesOrder ?? null,
      errorDetail: event.errorDetail ?? null,
      createdAt: event.createdAt,
      items: items.map((item) => this.mapItemView(item)),
    };
  }

  private mapItemView(item: ChannelEventItemEntity): ChannelEventItemView {
    return {
      idChannelEventItem: item.idChannelEventItem,
      externalProductId: item.externalProductId,
      externalProductName: item.externalProductName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      idProduct: item.idProduct ?? null,
    };
  }
}
