import { Inject, Injectable } from "@nestjs/common";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { NinetyNineFoodApiClient } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-api.client";

// A little slack before the actual expiry so a token doesn't die mid-call.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

// Caches each store's 99Food auth_token (see tb_channel_store_links) and
// refetches it once it's expired or missing — callers never see a token,
// they just get a valid one.
@Injectable()
export class NinetyNineFoodAuthService {
  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly apiClient: NinetyNineFoodApiClient,
  ) {}

  async getValidAuthToken(idStore: string): Promise<string> {
    const link = await this.channelOrderRepository.findStoreLink(
      idStore,
      SalesChannel.FOOD_99,
    );
    if (!link) {
      throw new Error(
        `Loja ${idStore} não está vinculada ao canal FOOD_99 — rode src/scripts/link-channel-store.script.ts.`,
      );
    }

    const isValid =
      link.authToken &&
      link.authTokenExpiresAt &&
      link.authTokenExpiresAt.getTime() - EXPIRY_SAFETY_MARGIN_MS > Date.now();
    if (isValid) {
      return link.authToken as string;
    }

    const fetched = await this.apiClient.getAuthToken(link.externalShopId);
    const expiresAt = new Date(fetched.tokenExpirationTime * 1000);
    await this.channelOrderRepository.saveStoreLinkToken(
      idStore,
      SalesChannel.FOOD_99,
      fetched.authToken,
      expiresAt,
    );
    return fetched.authToken;
  }
}
