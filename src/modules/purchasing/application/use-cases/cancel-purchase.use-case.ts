import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";
import { loadPurchaseOrFail } from "@/modules/purchasing/application/use-cases/purchase-access.helper";

@Injectable()
export class CancelPurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idPurchase: string,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.FINALIZE_PURCHASE,
    );

    const purchase = await loadPurchaseOrFail(
      this.purchaseRepository,
      idStore,
      idPurchase,
    );

    if (purchase.status === PurchaseStatus.FINALIZADA) {
      throw AppException.from(
        APP_ERRORS.purchasing.cannotCancelFinalized,
        undefined,
      );
    }
    if (purchase.status === PurchaseStatus.CANCELADA) {
      return purchase;
    }

    return this.purchaseRepository.setStatus(
      idPurchase,
      PurchaseStatus.CANCELADA,
    );
  }
}
