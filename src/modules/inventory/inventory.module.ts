import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { ProductEntity } from "@/modules/catalog/infrastructure/persistence/typeorm/entities/product.entity";
import { StoresModule } from "@/modules/stores/stores.module";
import { INVENTORY_REPOSITORY } from "@/modules/inventory/application/ports/inventory-repository.port";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { AdjustStockUseCase } from "@/modules/inventory/application/use-cases/adjust-stock.use-case";
import { ListStoreStockUseCase } from "@/modules/inventory/application/use-cases/list-store-stock.use-case";
import { ListStockMovementsUseCase } from "@/modules/inventory/application/use-cases/list-stock-movements.use-case";
import { StockItemEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-item.entity";
import { StockMovementEntity } from "@/modules/inventory/infrastructure/persistence/typeorm/entities/stock-movement.entity";
import { InventoryTypeormRepository } from "@/modules/inventory/infrastructure/persistence/typeorm/repositories/inventory-typeorm.repository";
import { InventoryResolver } from "@/modules/inventory/presentation/graphql/resolvers/inventory.resolver";
import "@/modules/inventory/presentation/graphql/enums/inventory-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockItemEntity,
      StockMovementEntity,
      ProductEntity,
    ]),
    CatalogModule,
    StoresModule,
  ],
  providers: [
    InventoryTypeormRepository,
    { provide: INVENTORY_REPOSITORY, useExisting: InventoryTypeormRepository },
    InventoryLedgerService,
    AdjustStockUseCase,
    ListStoreStockUseCase,
    ListStockMovementsUseCase,
    InventoryResolver,
  ],
  exports: [INVENTORY_REPOSITORY, InventoryLedgerService],
})
export class InventoryModule {}
