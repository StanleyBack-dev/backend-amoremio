import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  SalesOrderRepositoryPort,
  SalesOrderView,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

export async function loadSalesOrderOrFail(
  repository: SalesOrderRepositoryPort,
  idStore: string,
  idSalesOrder: string,
): Promise<SalesOrderView> {
  const order = await repository.findById(idStore, idSalesOrder);
  if (!order) {
    throw AppException.from(APP_ERRORS.sales.notFound, undefined);
  }
  return order;
}

export function assertOpen(order: SalesOrderView): void {
  if (order.status !== SalesOrderStatus.ABERTA) {
    throw AppException.from(APP_ERRORS.sales.notOpen, undefined);
  }
}
