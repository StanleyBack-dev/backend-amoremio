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
import { UpdatePurchaseHeaderCommand } from "@/modules/purchasing/application/dto/purchase.commands";
import { loadPurchaseOrFail } from "@/modules/purchasing/application/use-cases/purchase-access.helper";

@Injectable()
export class UpdatePurchaseHeaderUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdatePurchaseHeaderCommand,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const purchase = await loadPurchaseOrFail(
      this.purchaseRepository,
      command.idStore,
      command.idPurchase,
    );

    // A cancelled purchase is read-only. A finalized one is frozen financially
    // (its totals were already credited to stock) but its supplier / notes are
    // just labels and stay editable for corrections.
    if (purchase.status === PurchaseStatus.CANCELADA) {
      throw AppException.from(APP_ERRORS.purchasing.notDraft, undefined);
    }
    if (purchase.status !== PurchaseStatus.RASCUNHO) {
      const touchesFinancials =
        command.freightAmount !== undefined ||
        command.discountAmount !== undefined ||
        command.discountMode !== undefined ||
        command.discountPercent !== undefined ||
        command.purchaseDate !== undefined;
      if (touchesFinancials) {
        throw AppException.from(
          APP_ERRORS.purchasing.financialsLocked,
          undefined,
        );
      }
    }

    return this.purchaseRepository.updateHeader({
      idPurchase: command.idPurchase,
      supplierName:
        command.supplierName !== undefined
          ? (command.supplierName ?? "").trim() || null
          : undefined,
      purchaseDate: command.purchaseDate,
      freightAmount:
        command.freightAmount !== undefined
          ? Math.max(command.freightAmount, 0)
          : undefined,
      discountAmount:
        command.discountAmount !== undefined
          ? Math.max(command.discountAmount, 0)
          : undefined,
      discountMode: command.discountMode,
      discountPercent:
        command.discountPercent !== undefined
          ? Math.min(Math.max(command.discountPercent, 0), 100)
          : undefined,
      notes:
        command.notes !== undefined
          ? (command.notes ?? "").trim() || null
          : undefined,
    });
  }
}
