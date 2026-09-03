import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { currentDateOnly } from "@/common/utils/date.util";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import { SELLABLE_KINDS } from "@/modules/catalog/domain/enums/product-kind.enum";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SALES_ORDER_REPOSITORY,
  type SalesOrderFilterOptions,
  type SalesOrderRepositoryPort,
  type SalesOrderView,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import {
  AddSalesOrderItemCommand,
  CreateSalesOrderCommand,
  ListSalesOrdersQuery,
  UpdateSalesOrderHeaderCommand,
  UpdateSalesOrderItemCommand,
} from "@/modules/sales/application/dto/sales-order.commands";
import { SalesOrderCalculatorService } from "@/modules/sales/domain/services/sales-order-calculator.service";
import {
  assertOpen,
  loadSalesOrderOrFail,
} from "@/modules/sales/application/use-cases/sales-order-access.helper";

export interface PaginatedSalesOrders {
  items: SalesOrderView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class SalesOrderCrudUseCases {
  constructor(
    @Inject(SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  private assert(userId: string, idStore: string) {
    return this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_SALE,
    );
  }

  async create(
    userId: string,
    command: CreateSalesOrderCommand,
  ): Promise<SalesOrderView> {
    await this.assert(userId, command.idStore);
    return this.salesOrderRepository.create({
      idStore: command.idStore,
      customerName: (command.customerName ?? "").trim() || null,
      orderDate: command.orderDate ?? currentDateOnly(),
      salesChannel: command.salesChannel ?? SalesChannel.BALCAO,
      notes: (command.notes ?? "").trim() || null,
      createdByUserId: userId,
    });
  }

  async getById(
    userId: string,
    idStore: string,
    idSalesOrder: string,
  ): Promise<SalesOrderView> {
    await this.assert(userId, idStore);
    return loadSalesOrderOrFail(
      this.salesOrderRepository,
      idStore,
      idSalesOrder,
    );
  }

  async list(
    userId: string,
    query: ListSalesOrdersQuery,
  ): Promise<PaginatedSalesOrders> {
    await this.assert(userId, query.idStore);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const { records, total } = await this.salesOrderRepository.listByStore(
      query.idStore,
      {
        page,
        limit,
        status: query.status,
        customerName: query.customerName,
        salesChannel: query.salesChannel,
        createdByUserId: query.createdByUserId,
      },
    );
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async filterOptions(
    userId: string,
    idStore: string,
  ): Promise<SalesOrderFilterOptions> {
    await this.assert(userId, idStore);
    return this.salesOrderRepository.listFilterOptions(idStore);
  }

  async updateHeader(
    userId: string,
    command: UpdateSalesOrderHeaderCommand,
  ): Promise<SalesOrderView> {
    await this.assert(userId, command.idStore);
    const order = await loadSalesOrderOrFail(
      this.salesOrderRepository,
      command.idStore,
      command.idSalesOrder,
    );
    assertOpen(order);

    return this.salesOrderRepository.updateHeader({
      idSalesOrder: command.idSalesOrder,
      customerName:
        command.customerName !== undefined
          ? (command.customerName ?? "").trim() || null
          : undefined,
      orderDate: command.orderDate,
      salesChannel: command.salesChannel,
      commissionPercent:
        command.commissionPercent !== undefined
          ? Math.min(Math.max(command.commissionPercent, 0), 100)
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

  async addItem(
    userId: string,
    command: AddSalesOrderItemCommand,
  ): Promise<SalesOrderView> {
    await this.assert(userId, command.idStore);
    const order = await loadSalesOrderOrFail(
      this.salesOrderRepository,
      command.idStore,
      command.idSalesOrder,
    );
    assertOpen(order);

    const product = await this.productRepository.findById(
      command.idStore,
      command.idProduct,
    );
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    if (!SELLABLE_KINDS.includes(product.kind)) {
      throw AppException.from(APP_ERRORS.sales.productNotSellable, undefined);
    }

    const unitPrice = command.unitPrice ?? product.salePrice ?? 0;
    const calc = SalesOrderCalculatorService.calculate(
      [{ ref: "new", quantity: command.quantity, unitPrice }],
      0,
    );

    return this.salesOrderRepository.addItem({
      idSalesOrder: command.idSalesOrder,
      idProduct: product.idProduct,
      productName: product.name,
      productKind: product.kind,
      quantity: command.quantity,
      unitPrice,
      lineTotal: calc.lines[0].lineTotal,
    });
  }

  async updateItem(
    userId: string,
    command: UpdateSalesOrderItemCommand,
  ): Promise<SalesOrderView> {
    await this.assert(userId, command.idStore);
    const order = await loadSalesOrderOrFail(
      this.salesOrderRepository,
      command.idStore,
      command.idSalesOrder,
    );
    assertOpen(order);

    const current = order.items.find(
      (item) => item.idSalesOrderItem === command.idSalesOrderItem,
    );
    if (!current) {
      throw AppException.from(APP_ERRORS.sales.itemNotFound, undefined);
    }

    const quantity = command.quantity ?? current.quantity;
    const unitPrice = command.unitPrice ?? current.unitPrice;
    const calc = SalesOrderCalculatorService.calculate(
      [{ ref: "x", quantity, unitPrice }],
      0,
    );

    return this.salesOrderRepository.updateItem({
      idSalesOrder: command.idSalesOrder,
      idSalesOrderItem: command.idSalesOrderItem,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      lineTotal: calc.lines[0].lineTotal,
    });
  }

  async removeItem(
    userId: string,
    idStore: string,
    idSalesOrder: string,
    idSalesOrderItem: string,
  ): Promise<SalesOrderView> {
    await this.assert(userId, idStore);
    const order = await loadSalesOrderOrFail(
      this.salesOrderRepository,
      idStore,
      idSalesOrder,
    );
    assertOpen(order);
    return this.salesOrderRepository.removeItem(idSalesOrder, idSalesOrderItem);
  }
}
