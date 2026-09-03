import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { InventoryModule } from "@/modules/inventory/inventory.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { SALES_ORDER_REPOSITORY } from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesOrderCrudUseCases } from "@/modules/sales/application/use-cases/sales-order-crud.use-cases";
import { ConfirmSalesOrderUseCase } from "@/modules/sales/application/use-cases/confirm-sales-order.use-case";
import { CancelSalesOrderUseCase } from "@/modules/sales/application/use-cases/cancel-sales-order.use-case";
import { SalesOrderEntity } from "@/modules/sales/infrastructure/persistence/typeorm/entities/sales-order.entity";
import { SalesOrderItemEntity } from "@/modules/sales/infrastructure/persistence/typeorm/entities/sales-order-item.entity";
import { SalesOrderTypeormRepository } from "@/modules/sales/infrastructure/persistence/typeorm/repositories/sales-order-typeorm.repository";
import { SalesOrdersResolver } from "@/modules/sales/presentation/graphql/resolvers/sales-orders.resolver";
import "@/modules/sales/presentation/graphql/enums/sales-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrderEntity, SalesOrderItemEntity]),
    CatalogModule,
    InventoryModule,
    StoresModule,
  ],
  providers: [
    SalesOrderTypeormRepository,
    {
      provide: SALES_ORDER_REPOSITORY,
      useExisting: SalesOrderTypeormRepository,
    },
    SalesOrderCrudUseCases,
    ConfirmSalesOrderUseCase,
    CancelSalesOrderUseCase,
    SalesOrdersResolver,
  ],
})
export class SalesModule {}
