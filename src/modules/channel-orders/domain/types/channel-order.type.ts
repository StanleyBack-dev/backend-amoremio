import type { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";

// What a platform adapter (99Food, iFood, ...) must produce from its raw
// webhook payload before handing it to IngestChannelOrderUseCase — the
// use-case itself knows nothing about any specific platform's wire format.
export type ChannelOrderItemInput = {
  externalProductId: string;
  externalProductName: string;
  quantity: number;
  unitPrice: number;
};

export type ChannelOrder = {
  idStore: string;
  channel: SalesChannel;
  externalOrderId: string;
  customerName: string;
  // Null when the platform payload doesn't carry a phone — the order still
  // imports, just without a linked Customer (same as a walk-in typed by
  // hand with no phone on file).
  customerPhone: string | null;
  items: ChannelOrderItemInput[];
  notes?: string | null;
  // Stored verbatim in tb_channel_events for audit/replay.
  rawPayload: unknown;
};
