import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { PurchasingModule } from "@/modules/purchasing/purchasing.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { SHOPPING_LIST_REPOSITORY } from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { CreateShoppingListUseCase } from "@/modules/shopping-list/application/use-cases/create-shopping-list.use-case";
import { GetShoppingListByIdUseCase } from "@/modules/shopping-list/application/use-cases/get-shopping-list-by-id.use-case";
import { GetShoppingListByPurchaseIdUseCase } from "@/modules/shopping-list/application/use-cases/get-shopping-list-by-purchase-id.use-case";
import { ListShoppingListsUseCase } from "@/modules/shopping-list/application/use-cases/list-shopping-lists.use-case";
import { AddShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/add-shopping-list-item.use-case";
import { AddShoppingListItemsUseCase } from "@/modules/shopping-list/application/use-cases/add-shopping-list-items.use-case";
import { UpdateShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/update-shopping-list-item.use-case";
import { RemoveShoppingListItemUseCase } from "@/modules/shopping-list/application/use-cases/remove-shopping-list-item.use-case";
import { CancelShoppingListUseCase } from "@/modules/shopping-list/application/use-cases/cancel-shopping-list.use-case";
import { ConvertShoppingListToPurchaseUseCase } from "@/modules/shopping-list/application/use-cases/convert-shopping-list-to-purchase.use-case";
import { ShoppingListEntity } from "@/modules/shopping-list/infrastructure/persistence/typeorm/entities/shopping-list.entity";
import { ShoppingListItemEntity } from "@/modules/shopping-list/infrastructure/persistence/typeorm/entities/shopping-list-item.entity";
import { ShoppingListTypeormRepository } from "@/modules/shopping-list/infrastructure/persistence/typeorm/repositories/shopping-list-typeorm.repository";
import { ShoppingListsResolver } from "@/modules/shopping-list/presentation/graphql/resolvers/shopping-lists.resolver";
import "@/modules/shopping-list/presentation/graphql/enums/shopping-list-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingListEntity, ShoppingListItemEntity]),
    CatalogModule,
    PurchasingModule,
    StoresModule,
  ],
  providers: [
    ShoppingListTypeormRepository,
    {
      provide: SHOPPING_LIST_REPOSITORY,
      useExisting: ShoppingListTypeormRepository,
    },
    CreateShoppingListUseCase,
    GetShoppingListByIdUseCase,
    GetShoppingListByPurchaseIdUseCase,
    ListShoppingListsUseCase,
    AddShoppingListItemUseCase,
    AddShoppingListItemsUseCase,
    UpdateShoppingListItemUseCase,
    RemoveShoppingListItemUseCase,
    CancelShoppingListUseCase,
    ConvertShoppingListToPurchaseUseCase,
    ShoppingListsResolver,
  ],
})
export class ShoppingListModule {}
