import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersModule } from "@/modules/customers/customers.module";
import { SalesModule } from "@/modules/sales/sales.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { CHANNEL_ORDER_REPOSITORY } from "@/modules/channel-orders/application/ports/channel-order-repository.port";
import { ChannelEventPromotionService } from "@/modules/channel-orders/application/services/channel-event-promotion.service";
import { IngestChannelOrderUseCase } from "@/modules/channel-orders/application/use-cases/ingest-channel-order.use-case";
import { ListUnmappedChannelProductsUseCase } from "@/modules/channel-orders/application/use-cases/list-unmapped-channel-products.use-case";
import { MapChannelProductUseCase } from "@/modules/channel-orders/application/use-cases/map-channel-product.use-case";
import { ChannelEventEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-event.entity";
import { ChannelEventItemEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-event-item.entity";
import { ChannelProductMappingEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-product-mapping.entity";
import { ChannelStoreLinkEntity } from "@/modules/channel-orders/infrastructure/persistence/typeorm/entities/channel-store-link.entity";
import { ChannelOrderTypeormRepository } from "@/modules/channel-orders/infrastructure/persistence/typeorm/repositories/channel-order-typeorm.repository";
import { NinetyNineFoodApiClient } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-api.client";
import { NinetyNineFoodAuthService } from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-auth.service";
import { NinetyNineFoodWebhookController } from "@/modules/channel-orders/presentation/rest/ninety-nine-food-webhook.controller";
import { ChannelOrdersResolver } from "@/modules/channel-orders/presentation/graphql/resolvers/channel-orders.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEventEntity,
      ChannelEventItemEntity,
      ChannelProductMappingEntity,
      ChannelStoreLinkEntity,
    ]),
    StoresModule,
    CustomersModule,
    SalesModule,
  ],
  controllers: [NinetyNineFoodWebhookController],
  providers: [
    ChannelOrderTypeormRepository,
    {
      provide: CHANNEL_ORDER_REPOSITORY,
      useExisting: ChannelOrderTypeormRepository,
    },
    ChannelEventPromotionService,
    IngestChannelOrderUseCase,
    MapChannelProductUseCase,
    ListUnmappedChannelProductsUseCase,
    ChannelOrdersResolver,
    NinetyNineFoodApiClient,
    NinetyNineFoodAuthService,
  ],
  exports: [IngestChannelOrderUseCase],
})
export class ChannelOrdersModule {}
