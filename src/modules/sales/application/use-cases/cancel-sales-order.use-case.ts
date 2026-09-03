import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SALES_ORDER_REPOSITORY,
  type SalesOrderRepositoryPort,
  type SalesOrderView,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";
import { loadSalesOrderOrFail } from "@/modules/sales/application/use-cases/sales-order-access.helper";

@Injectable()
export class CancelSalesOrderUseCase {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idSalesOrder: string,
  ): Promise<SalesOrderView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.CONFIRM_SALE,
    );

    const order = await loadSalesOrderOrFail(
      this.salesOrderRepository,
      idStore,
      idSalesOrder,
    );

    if (order.status === SalesOrderStatus.CONFIRMADA) {
      throw AppException.from(
        APP_ERRORS.sales.cannotCancelConfirmed,
        undefined,
      );
    }
    if (order.status === SalesOrderStatus.CANCELADA) {
      return order;
    }

    return this.salesOrderRepository.setStatus(
      idSalesOrder,
      SalesOrderStatus.CANCELADA,
    );
  }
}
