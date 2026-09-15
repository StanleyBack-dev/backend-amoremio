import { Inject, Injectable } from "@nestjs/common";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { IfoodApiClient } from "@/modules/channel-orders/infrastructure/ifood/ifood-api.client";

// A little slack before the actual expiry so a token doesn't die mid-call.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

// Caches this app's iFood access token (see tb_channel_store_links) and
// refetches it once it's expired or missing. Unlike 99Food, iFood's
// client_credentials token is app-level, not per-store — but it's cached
// against each store's link row anyway (same shape as
// NinetyNineFoodAuthService) so it survives serverless cold starts without
// a dedicated app-level cache table.
@Injectable()
export class IfoodAuthService {
  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly apiClient: IfoodApiClient,
  ) {}

  async getValidAuthToken(idStore: string): Promise<string> {
    const link = await this.channelOrderRepository.findStoreLink(
      idStore,
      SalesChannel.IFOOD,
    );
    if (!link) {
      throw new Error(
        `Loja ${idStore} não está vinculada ao canal IFOOD — rode src/scripts/link-channel-store.script.ts.`,
      );
    }

    const isValid =
      link.authToken &&
      link.authTokenExpiresAt &&
      link.authTokenExpiresAt.getTime() - EXPIRY_SAFETY_MARGIN_MS > Date.now();
    if (isValid) {
      return link.authToken as string;
    }

    const fetched = await this.apiClient.getAuthToken();
    const expiresAt = new Date(Date.now() + fetched.expiresIn * 1000);
    await this.channelOrderRepository.saveStoreLinkToken(
      idStore,
      SalesChannel.IFOOD,
      fetched.accessToken,
      expiresAt,
    );
    return fetched.accessToken;
  }
}
