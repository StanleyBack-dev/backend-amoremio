import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { currentDateOnly } from "@/common/utils/date.util";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepositoryPort,
} from "@/modules/customers/application/ports/customer-repository.port";
import {
  SELLABLE_KINDS,
  type ProductKind,
} from "@/modules/catalog/domain/enums/product-kind.enum";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";
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
  AddSalesOrderItemsCommand,
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
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  private assert(userId: string, idStore: string) {
    return this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.REGISTER_SALE,
    );
  }

  // A linked customer's name is the source of truth for the order's display
  // snapshot — same relationship as a sale item's idProduct/productName —
  // so the two never drift apart. Orders with no linked customer keep the
  // free-text name exactly as before (walk-ins, legacy orders).
  private async resolveCustomerName(
    idStore: string,
    idCustomer: string,
  ): Promise<string> {
    const customer = await this.customerRepository.findById(
      idStore,
      idCustomer,
    );
    if (!customer) {
      throw AppException.from(APP_ERRORS.customers.notFound, undefined);
    }
    return customer.name;
  }

  async create(
    userId: string,
    command: CreateSalesOrderCommand,
  ): Promise<SalesOrderView> {
    await this.assert(userId, command.idStore);

    const idCustomer = command.idCustomer ?? null;
    const customerName = idCustomer
      ? await this.resolveCustomerName(command.idStore, idCustomer)
      : (command.customerName ?? "").trim() || null;

    return this.salesOrderRepository.create({
      idStore: command.idStore,
      idCustomer,
      customerName,
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

    // A cancelled order is read-only. A confirmed one has everything else
    // frozen (stock already debited, totals settled) but the sale date is
    // just a label — kept correctable after the fact.
    if (order.status === SalesOrderStatus.CANCELADA) {
      throw AppException.from(APP_ERRORS.sales.notOpen, undefined);
    }
    if (order.status !== SalesOrderStatus.ABERTA) {
      const touchesLockedFields =
        command.idCustomer !== undefined ||
        command.customerName !== undefined ||
        command.salesChannel !== undefined ||
        command.commissionPercent !== undefined ||
        command.discountAmount !== undefined ||
        command.discountMode !== undefined ||
        command.discountPercent !== undefined ||
        command.notes !== undefined;
      if (touchesLockedFields) {
        throw AppException.from(APP_ERRORS.sales.headerLocked, undefined);
      }
    }

    // idCustomer, when present, wins over free-text customerName and drives
    // its snapshot (see resolveCustomerName). Passing idCustomer: null
    // unlinks the customer and clears the name; omitting it entirely falls
    // back to the legacy free-text path, untouched.
    let idCustomer: string | null | undefined;
    let customerName: string | null | undefined;
    if (command.idCustomer !== undefined) {
      idCustomer = command.idCustomer;
      customerName = idCustomer
        ? await this.resolveCustomerName(command.idStore, idCustomer)
        : null;
    } else if (command.customerName !== undefined) {
      customerName = (command.customerName ?? "").trim() || null;
    }

    return this.salesOrderRepository.updateHeader({
      idSalesOrder: command.idSalesOrder,
      idCustomer,
      customerName,
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

  // Bulk counterpart to addItem — the frontend stages several products
  // client-side (add-to-list, same pattern as Compras/Receitas) and sends
  // them all in one call instead of one round-trip per item.
  async addItems(
    userId: string,
    command: AddSalesOrderItemsCommand,
  ): Promise<SalesOrderView> {
    if (!command.items || command.items.length === 0) {
      throw AppException.from(APP_ERRORS.sales.noItemsToAdd, undefined);
    }

    const [, order] = await Promise.all([
      this.assert(userId, command.idStore),
      loadSalesOrderOrFail(
        this.salesOrderRepository,
        command.idStore,
        command.idSalesOrder,
      ),
    ]);
    assertOpen(order);

    // Load every referenced product in one query instead of one per entry —
    // the same batching AddRecipeItemsCommand uses.
    const requestedIds = [
      ...new Set(command.items.map((entry) => entry.idProduct)),
    ];
    const products = await this.productRepository.findManyByIds(
      command.idStore,
      requestedIds,
    );
    const productById = new Map(products.map((p) => [p.idProduct, p]));

    const seen = new Set(order.items.map((item) => item.idProduct));
    const entries: {
      idProduct: string;
      productName: string;
      productKind: ProductKind;
      quantity: number;
      unitPrice: number;
    }[] = [];
    for (const entry of command.items) {
      const product = productById.get(entry.idProduct);
      if (!product) {
        throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
      }
      if (!SELLABLE_KINDS.includes(product.kind)) {
        throw AppException.from(APP_ERRORS.sales.productNotSellable, undefined);
      }
      if (seen.has(product.idProduct)) {
        throw AppException.from(APP_ERRORS.sales.duplicatedItem, {
          product: product.name,
        });
      }
      seen.add(product.idProduct);
      entries.push({
        idProduct: product.idProduct,
        productName: product.name,
        productKind: product.kind,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice ?? product.salePrice ?? 0,
      });
    }

    // calculate() validates quantity/price itself (throws the same errors
    // addItem relies on) and returns each line's total keyed by ref.
    const calc = SalesOrderCalculatorService.calculate(
      entries.map((entry) => ({
        ref: entry.idProduct,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
      })),
      0,
    );
    const lineTotalByRef = new Map(
      calc.lines.map((line) => [line.ref, line.lineTotal]),
    );

    return this.salesOrderRepository.addItems({
      idSalesOrder: command.idSalesOrder,
      items: entries.map((entry) => ({
        ...entry,
        lineTotal: lineTotalByRef.get(entry.idProduct) ?? 0,
      })),
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
