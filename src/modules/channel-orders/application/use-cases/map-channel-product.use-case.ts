import { Inject, Injectable, Logger } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { ChannelEventPromotionService } from "@/modules/channel-orders/application/services/channel-event-promotion.service";

export class MapChannelProductCommand {
  idStore!: string;
  channel!: SalesChannel;
  externalProductId!: string;
  externalProductName!: string;
  idProduct!: string;
}

export interface MapChannelProductResult {
  promotedOrders: number;
  failedOrders: number;
}

// Called from the "pendências de mapeamento" screen: one external menu item
// (e.g. "Batidinha Maracujá 300ml" on 99Food) gets pointed at one internal
// product, and every order that was only waiting on that item gets
// promoted to a real Venda right away — mapping once commonly unblocks
// several orders at once, since the same menu item repeats across them.
@Injectable()
export class MapChannelProductUseCase {
  private readonly logger = new Logger(MapChannelProductUseCase.name);

  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly promotionService: ChannelEventPromotionService,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: MapChannelProductCommand,
  ): Promise<MapChannelProductResult> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_SALE,
    );

    await this.channelOrderRepository.upsertProductMapping({
      idStore: command.idStore,
      channel: command.channel,
      externalProductId: command.externalProductId,
      externalProductName: command.externalProductName,
      idProduct: command.idProduct,
    });

    const pending =
      await this.channelOrderRepository.listPendingEventsByExternalProduct(
        command.idStore,
        command.channel,
        command.externalProductId,
      );

    let promotedOrders = 0;
    let failedOrders = 0;
    for (const event of pending) {
      const stillBlocked = event.items.some((item) => item.idProduct === null);
      if (stillBlocked) continue;

      try {
        await this.promotionService.promote(event);
        promotedOrders++;
      } catch (error) {
        failedOrders++;
        const message =
          error instanceof Error ? error.message : "erro desconhecido";
        this.logger.error(
          `Falha ao promover evento de canal ${event.idChannelEvent} após mapeamento: ${message}`,
        );
        await this.channelOrderRepository.markEventFailed(
          event.idChannelEvent,
          message,
        );
      }
    }

    return { promotedOrders, failedOrders };
  }
}
