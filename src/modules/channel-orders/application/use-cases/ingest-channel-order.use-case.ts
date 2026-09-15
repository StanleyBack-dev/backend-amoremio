import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { ChannelEventPromotionService } from "@/modules/channel-orders/application/services/channel-event-promotion.service";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";

export type IngestChannelOrderResult =
  | { outcome: "DUPLICATE"; idChannelEvent: string }
  | { outcome: "PENDING_MAPPING"; idChannelEvent: string }
  | { outcome: "IMPORTED"; idChannelEvent: string; idSalesOrder: string };

// Platform-agnostic entry point for every webhook adapter (99Food, iFood,
// ...): takes an already-normalized ChannelOrder and either creates the
// Venda right away (every item mapped) or parks it pending mapping. No
// HTTP, no signature verification, no platform-specific parsing here — that
// all lives in the adapter that calls this use-case (see
// presentation/rest/*-webhook.controller.ts).
@Injectable()
export class IngestChannelOrderUseCase {
  private readonly logger = new Logger(IngestChannelOrderUseCase.name);

  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly promotionService: ChannelEventPromotionService,
  ) {}

  async execute(order: ChannelOrder): Promise<IngestChannelOrderResult> {
    // Idempotency: the platform can and will retry the same delivery.
    const existing =
      await this.channelOrderRepository.findEventByExternalOrderId(
        order.idStore,
        order.channel,
        order.externalOrderId,
      );
    if (existing) {
      return { outcome: "DUPLICATE", idChannelEvent: existing.idChannelEvent };
    }

    // createEvent resolves idProduct on each item from whatever mappings
    // already exist, and persists status PENDING_MAPPING regardless — the
    // caller (here) decides whether to promote it immediately after.
    const event = await this.channelOrderRepository.createEvent(order);

    const allMapped = event.items.every((item) => item.idProduct !== null);
    if (!allMapped) {
      return {
        outcome: "PENDING_MAPPING",
        idChannelEvent: event.idChannelEvent,
      };
    }

    try {
      const idSalesOrder = await this.promotionService.promote(event);
      return {
        outcome: "IMPORTED",
        idChannelEvent: event.idChannelEvent,
        idSalesOrder,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "erro desconhecido";
      this.logger.error(
        `Falha ao importar evento de canal ${event.idChannelEvent}: ${message}`,
      );
      await this.channelOrderRepository.markEventFailed(
        event.idChannelEvent,
        message,
      );
      throw error;
    }
  }
}
