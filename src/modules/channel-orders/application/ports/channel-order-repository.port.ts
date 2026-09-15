import type { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { ChannelEventStatus } from "@/modules/channel-orders/domain/enums/channel-event-status.enum";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";

export type ChannelEventItemView = {
  idChannelEventItem: string;
  externalProductId: string;
  externalProductName: string;
  quantity: number;
  unitPrice: number;
  idProduct: string | null;
};

export type ChannelEventView = {
  idChannelEvent: string;
  idStore: string;
  channel: SalesChannel;
  externalOrderId: string;
  status: ChannelEventStatus;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
  idSalesOrder: string | null;
  errorDetail: string | null;
  createdAt: Date;
  items: ChannelEventItemView[];
};

export type UnmappedChannelProductView = {
  idStore: string;
  channel: SalesChannel;
  externalProductId: string;
  externalProductName: string;
  pendingEventCount: number;
};

export type ChannelStoreLinkView = {
  idStore: string;
  channel: SalesChannel;
  externalShopId: string;
  authToken: string | null;
  authTokenExpiresAt: Date | null;
};

export interface ChannelOrderRepositoryPort {
  // Resolves a webhook's platform-side shop id back to our idtb_stores (see
  // ChannelStoreLinkEntity) — null means nobody linked that shop yet.
  findStoreIdByExternalShopId(
    channel: SalesChannel,
    externalShopId: string,
  ): Promise<string | null>;

  findStoreLink(
    idStore: string,
    channel: SalesChannel,
  ): Promise<ChannelStoreLinkView | null>;

  // Caches a freshly-fetched platform API token for this store+channel —
  // see NinetyNineFoodAuthService.
  saveStoreLinkToken(
    idStore: string,
    channel: SalesChannel,
    authToken: string,
    authTokenExpiresAt: Date,
  ): Promise<void>;

  findEventByExternalOrderId(
    idStore: string,
    channel: SalesChannel,
    externalOrderId: string,
  ): Promise<ChannelEventView | null>;

  // Persists the event + its items in one go, resolving idProduct on each
  // item from whatever mappings already exist at insert time.
  createEvent(order: ChannelOrder): Promise<ChannelEventView>;

  findEventById(idChannelEvent: string): Promise<ChannelEventView | null>;

  markEventImported(
    idChannelEvent: string,
    idSalesOrder: string,
  ): Promise<void>;

  markEventFailed(idChannelEvent: string, errorDetail: string): Promise<void>;

  // Creates the mapping if it's new, or repoints an existing one to a
  // different idProduct. Also backfills idProduct on every
  // tb_channel_event_items row sharing this external_product_id — that's
  // what lets a single mapping unblock every order waiting on it.
  upsertProductMapping(payload: {
    idStore: string;
    channel: SalesChannel;
    externalProductId: string;
    externalProductName: string;
    idProduct: string;
  }): Promise<void>;

  listUnmappedProducts(idStore: string): Promise<UnmappedChannelProductView[]>;

  // Events still PENDING_MAPPING that have (or had) at least one item
  // pointing at this external product — candidates to re-check for
  // promotion right after a mapping is saved.
  listPendingEventsByExternalProduct(
    idStore: string,
    channel: SalesChannel,
    externalProductId: string,
  ): Promise<ChannelEventView[]>;
}

export const CHANNEL_ORDER_REPOSITORY = Symbol("CHANNEL_ORDER_REPOSITORY");
