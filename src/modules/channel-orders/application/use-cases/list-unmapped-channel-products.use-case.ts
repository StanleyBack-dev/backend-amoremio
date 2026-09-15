import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelOrderRepositoryPort,
  type UnmappedChannelProductView,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";

@Injectable()
export class ListUnmappedChannelProductsUseCase {
  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
  ): Promise<UnmappedChannelProductView[]> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_SALE,
    );

    return this.channelOrderRepository.listUnmappedProducts(idStore);
  }
}
