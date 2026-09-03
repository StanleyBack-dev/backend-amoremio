import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { InventoryModule } from "@/modules/inventory/inventory.module";
import { StoresModule } from "@/modules/stores/stores.module";
import { PURCHASE_REPOSITORY } from "@/modules/purchasing/application/ports/purchase-repository.port";
import { CreatePurchaseDraftUseCase } from "@/modules/purchasing/application/use-cases/create-purchase-draft.use-case";
import { GetPurchaseByIdUseCase } from "@/modules/purchasing/application/use-cases/get-purchase-by-id.use-case";
import { ListPurchasesUseCase } from "@/modules/purchasing/application/use-cases/list-purchases.use-case";
import { UpdatePurchaseHeaderUseCase } from "@/modules/purchasing/application/use-cases/update-purchase-header.use-case";
import { AddPurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/add-purchase-item.use-case";
import { UpdatePurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/update-purchase-item.use-case";
import { RemovePurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/remove-purchase-item.use-case";
import { FinalizePurchaseUseCase } from "@/modules/purchasing/application/use-cases/finalize-purchase.use-case";
import { CancelPurchaseUseCase } from "@/modules/purchasing/application/use-cases/cancel-purchase.use-case";
import { PurchaseEntity } from "@/modules/purchasing/infrastructure/persistence/typeorm/entities/purchase.entity";
import { PurchaseItemEntity } from "@/modules/purchasing/infrastructure/persistence/typeorm/entities/purchase-item.entity";
import { PurchaseTypeormRepository } from "@/modules/purchasing/infrastructure/persistence/typeorm/repositories/purchase-typeorm.repository";
import { PurchasesResolver } from "@/modules/purchasing/presentation/graphql/resolvers/purchases.resolver";
import "@/modules/purchasing/presentation/graphql/enums/purchasing-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseEntity, PurchaseItemEntity]),
    CatalogModule,
    InventoryModule,
    StoresModule,
  ],
  providers: [
    PurchaseTypeormRepository,
    { provide: PURCHASE_REPOSITORY, useExisting: PurchaseTypeormRepository },
    CreatePurchaseDraftUseCase,
    GetPurchaseByIdUseCase,
    ListPurchasesUseCase,
    UpdatePurchaseHeaderUseCase,
    AddPurchaseItemUseCase,
    UpdatePurchaseItemUseCase,
    RemovePurchaseItemUseCase,
    FinalizePurchaseUseCase,
    CancelPurchaseUseCase,
    PurchasesResolver,
  ],
})
export class PurchasingModule {}
