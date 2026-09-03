import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { InventoryModule } from "@/modules/inventory/inventory.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { RECIPE_REPOSITORY } from "@/modules/production/application/ports/recipe-repository.port";
import { PRODUCTION_ORDER_REPOSITORY } from "@/modules/production/application/ports/production-order-repository.port";
import { RecipeCrudUseCases } from "@/modules/production/application/use-cases/recipe-crud.use-cases";
import { ProductionOrderCrudUseCases } from "@/modules/production/application/use-cases/production-order-crud.use-cases";
import { CompleteProductionOrderUseCase } from "@/modules/production/application/use-cases/complete-production-order.use-case";
import { RecipeEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe.entity";
import { RecipeItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/recipe-item.entity";
import { ProductionOrderEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order.entity";
import { ProductionOrderItemEntity } from "@/modules/production/infrastructure/persistence/typeorm/entities/production-order-item.entity";
import { ProductionTypeormRepository } from "@/modules/production/infrastructure/persistence/typeorm/repositories/production-typeorm.repository";
import { ProductionResolver } from "@/modules/production/presentation/graphql/resolvers/production.resolver";
import "@/modules/production/presentation/graphql/enums/production-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecipeEntity,
      RecipeItemEntity,
      ProductionOrderEntity,
      ProductionOrderItemEntity,
    ]),
    CatalogModule,
    InventoryModule,
    StoresModule,
  ],
  providers: [
    ProductionTypeormRepository,
    { provide: RECIPE_REPOSITORY, useExisting: ProductionTypeormRepository },
    {
      provide: PRODUCTION_ORDER_REPOSITORY,
      useExisting: ProductionTypeormRepository,
    },
    RecipeCrudUseCases,
    ProductionOrderCrudUseCases,
    CompleteProductionOrderUseCase,
    ProductionResolver,
  ],
})
export class ProductionModule {}
