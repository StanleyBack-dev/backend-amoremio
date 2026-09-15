import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { currentDateOnly } from "@/common/utils/date.util";
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepositoryPort,
} from "@/modules/customers/application/ports/customer-repository.port";
import { CreateCustomerUseCase } from "@/modules/customers/application/use-cases/create-customer.use-case";
import { normalizePhone } from "@/modules/customers/domain/entities/customer.entity";
import { SalesOrderCrudUseCases } from "@/modules/sales/application/use-cases/sales-order-crud.use-cases";
import {
  CHANNEL_ORDER_REPOSITORY,
  type ChannelEventView,
  type ChannelOrderRepositoryPort,
} from "@/modules/channel-orders/application/ports/channel-order-repository.port";

// Turns a fully-mapped ChannelEventView into a real Venda — shared by
// IngestChannelOrderUseCase (order arrives already fully mapped) and
// MapChannelProductUseCase (the last blocking item just got mapped).
// Everything it creates is attributed to the seeded system user (see
// seed-system-user.script.ts): a webhook has no human operator behind it,
// and StoreAuthorizationService already treats an ADMIN_MASTER account as
// implicitly permitted in every store, so this reuses CreateCustomerUseCase
// and SalesOrderCrudUseCases completely unchanged instead of duplicating
// their validation/dedupe logic.
@Injectable()
export class ChannelEventPromotionService {
  constructor(
    @Inject(CHANNEL_ORDER_REPOSITORY)
    private readonly channelOrderRepository: ChannelOrderRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly salesOrderCrudUseCases: SalesOrderCrudUseCases,
    private readonly configService: ConfigService,
  ) {}

  private systemUserId(): string {
    const id = this.configService.get<string>("SYSTEM_USER_ID");
    if (!id) {
      throw new Error(
        "SYSTEM_USER_ID não configurado — rode src/scripts/seed-system-user.script.ts e defina a env var antes de ingerir pedidos de canal.",
      );
    }
    return id;
  }

  // Precondition: every item in `event` already has idProduct set. Callers
  // (Ingest/MapChannelProduct) are responsible for checking that first.
  async promote(event: ChannelEventView): Promise<string> {
    const userId = this.systemUserId();

    let idCustomer: string | null = null;
    const phone = normalizePhone(event.customerPhone);
    if (phone) {
      const existing = await this.customerRepository.findByPhone(
        event.idStore,
        phone,
      );
      if (existing) {
        idCustomer = existing.idCustomer;
      } else {
        const created = await this.createCustomerUseCase.execute(userId, {
          idStore: event.idStore,
          name: event.customerName,
          phone,
        });
        idCustomer = created.idCustomer;
      }
    }

    const order = await this.salesOrderCrudUseCases.create(userId, {
      idStore: event.idStore,
      idCustomer,
      customerName: idCustomer ? undefined : event.customerName,
      orderDate: currentDateOnly(),
      salesChannel: event.channel,
      notes: event.notes ?? `Pedido ${event.channel} #${event.externalOrderId}`,
    });

    await this.salesOrderCrudUseCases.addItems(userId, {
      idStore: event.idStore,
      idSalesOrder: order.idSalesOrder,
      items: event.items.map((item) => ({
        idProduct: item.idProduct as string,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    await this.channelOrderRepository.markEventImported(
      event.idChannelEvent,
      order.idSalesOrder,
    );

    return order.idSalesOrder;
  }
}
