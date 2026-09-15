import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";
import type {
  IfoodOrderCustomer,
  IfoodOrderDetail,
} from "@/modules/channel-orders/infrastructure/ifood/ifood-webhook.types";

function resolveCustomerName(customer: IfoodOrderCustomer | undefined): string {
  return customer?.name?.trim() || "Cliente iFood";
}

// iFood typically exposes only the masked/proxy `localizer` number so the
// merchant can call the customer without seeing the real one — same
// privacy-masking idea as 99Food's virtual_phone_number. Phone-based
// Customer dedupe (see ChannelEventPromotionService) still runs against
// whatever comes back; it just won't match a customer's real number when
// only the localizer is present.
function resolveCustomerPhone(
  customer: IfoodOrderCustomer | undefined,
): string | null {
  return customer?.phone?.number || customer?.phone?.localizer || null;
}

// Turns an iFood Order Details response into the platform-agnostic
// ChannelOrder shape IngestChannelOrderUseCase expects.
export function normalizeIfoodOrder(
  orderDetail: IfoodOrderDetail,
  idStore: string,
): ChannelOrder {
  return {
    idStore,
    channel: SalesChannel.IFOOD,
    externalOrderId: orderDetail.id,
    customerName: resolveCustomerName(orderDetail.customer),
    customerPhone: resolveCustomerPhone(orderDetail.customer),
    items: orderDetail.items.map((item) => ({
      externalProductId: item.id || item.externalCode || item.name,
      externalProductName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    rawPayload: orderDetail,
  };
}
