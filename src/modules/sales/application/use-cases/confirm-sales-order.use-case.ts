import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { STOCK_MOVING_ON_SALE_KINDS } from "@/modules/catalog/domain/enums/product-kind.enum";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import { InventoryLedgerService } from "@/modules/inventory/application/services/inventory-ledger.service";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import {
  SALES_ORDER_REPOSITORY,
  type SalesOrderRepositoryPort,
  type SalesOrderView,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesOrderCalculatorService } from "@/modules/sales/domain/services/sales-order-calculator.service";
import {
  assertOpen,
  loadSalesOrderOrFail,
} from "@/modules/sales/application/use-cases/sales-order-access.helper";

const SALE_SOURCE = "SALES_ORDER";

@Injectable()
export class ConfirmSalesOrderUseCase {
  private readonly logger = new Logger(ConfirmSalesOrderUseCase.name);

  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepositoryPort,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
    private readonly inventoryLedgerService: InventoryLedgerService,
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
    assertOpen(order);

    if (order.items.length === 0) {
      throw AppException.from(APP_ERRORS.sales.emptyOrder, undefined);
    }

    // Only kinds that actually hold stock are checked and moved. Finished
    // goods (PRODUTO_FINAL) generate revenue but do not touch stock until a
    // production context exists.
    const stockMovingItems = order.items.filter((item) =>
      STOCK_MOVING_ON_SALE_KINDS.includes(item.productKind),
    );

    // Check every stock-moving line has enough on hand before touching
    // anything — a confirmed order must never leave stock negative. One
    // batched read instead of a query per line.
    const stockByProduct = await this.inventoryRepository.getCurrentStockBatch(
      idStore,
      stockMovingItems.map((item) => item.idProduct),
    );
    for (const item of stockMovingItems) {
      const onHand = stockByProduct.get(item.idProduct)?.quantityOnHand ?? 0;
      if (onHand < item.quantity) {
        throw AppException.from(APP_ERRORS.sales.insufficientStock, {
          product: item.productName,
        });
      }
    }

    const calc = SalesOrderCalculatorService.calculate(
      order.items.map((item) => ({
        ref: item.idSalesOrderItem,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      order.discountAmount,
      order.commissionPercent,
    );

    const confirmed = await this.salesOrderRepository.confirm({
      idSalesOrder,
      itemsSubtotal: calc.itemsSubtotal,
      discountAmount: calc.discountAmount,
      total: calc.total,
      commissionPercent: calc.commissionPercent,
      commissionAmount: calc.commissionAmount,
      netTotal: calc.netTotal,
      confirmedAt: new Date(),
    });

    // Debit every stock-moving line in one batched transaction.
    try {
      await this.inventoryLedgerService.registerMovements(
        stockMovingItems.map((item) => ({
          idStore,
          idProduct: item.idProduct,
          type: StockMovementType.SAIDA_VENDA,
          quantity: item.quantity,
          sourceType: SALE_SOURCE,
          sourceId: idSalesOrder,
          note: `Venda ${idSalesOrder}`,
          createdByUserId: userId,
          occurredAt: order.orderDate,
        })),
      );
    } catch (error) {
      // The order stays confirmed; the stock debit did not apply (the batch
      // is atomic). Surfaced for a manual stock adjustment.
      this.logger.error(
        `Falha ao baixar estoque da venda ${idSalesOrder}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }

    return confirmed;
  }
}
