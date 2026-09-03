import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { PurchaseRepositoryPort } from "@/modules/purchasing/application/ports/purchase-repository.port";
import type { PurchaseView } from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

export async function loadPurchaseOrFail(
  repository: PurchaseRepositoryPort,
  idStore: string,
  idPurchase: string,
): Promise<PurchaseView> {
  const purchase = await repository.findById(idStore, idPurchase);
  if (!purchase) {
    throw AppException.from(APP_ERRORS.purchasing.notFound, undefined);
  }
  return purchase;
}

export function assertDraft(purchase: PurchaseView): void {
  if (purchase.status !== PurchaseStatus.RASCUNHO) {
    throw AppException.from(APP_ERRORS.purchasing.notDraft, undefined);
  }
}
