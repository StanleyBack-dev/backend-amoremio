import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import {
  assertDraft,
  loadPurchaseOrFail,
} from "@/modules/purchasing/application/use-cases/purchase-access.helper";

@Injectable()
export class RemovePurchaseItemUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idPurchase: string,
    idPurchaseItem: string,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const purchase = await loadPurchaseOrFail(
      this.purchaseRepository,
      idStore,
      idPurchase,
    );
    assertDraft(purchase);

    return this.purchaseRepository.removeItem(idPurchase, idPurchaseItem);
  }
}
