import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { ChannelOrder } from "@/modules/channel-orders/domain/types/channel-order.type";
import type {
  NinetyNineFoodOrderData,
  NinetyNineFoodReceiveAddress,
} from "@/modules/channel-orders/infrastructure/ninety-nine-food/ninety-nine-food-webhook.types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveCustomerName(
  address: NinetyNineFoodReceiveAddress | undefined,
): string {
  const name = (address?.name ?? "").trim();
  // 99Food masks this to the literal string "privacy protection" under its
  // Data Privacy Policy processing — not a real name, but harmless to keep
  // as the order's display snapshot either way.
  if (name) return name;
  const fullName =
    `${address?.first_name ?? ""} ${address?.last_name ?? ""}`.trim();
  return fullName || "Cliente 99Food";
}

// 99Food may return `phone` partially masked (e.g. "000****1406") under its
// Data Privacy Policy processing instead of the real number — confirmed in
// their docs, not just a guess. Phone-based Customer dedupe (see
// ChannelEventPromotionService) will still run against whatever comes
// back, it just won't be reliable when masked. No workaround for that on
// our side; it's what the platform provides.
function resolveCustomerPhone(
  address: NinetyNineFoodReceiveAddress | undefined,
): string | null {
  return address?.phone || address?.virtual_phone_number || null;
}

// Turns a 99Food order (same shape for the orderNew webhook's `data` field
// and the /order/order/detail response's `data` field) into the
// platform-agnostic ChannelOrder shape IngestChannelOrderUseCase expects.
// Only top-level order_items become lines — combo/modifier sub_item_list
// entries price at 0 and are folded into their parent item, not imported
// separately.
export function normalizeNinetyNineFoodOrder(
  orderData: NinetyNineFoodOrderData,
  idStore: string,
): ChannelOrder {
  const { order_info } = orderData;

  return {
    idStore,
    channel: SalesChannel.FOOD_99,
    externalOrderId: orderData.order_id,
    customerName: resolveCustomerName(order_info.receive_address),
    customerPhone: resolveCustomerPhone(order_info.receive_address),
    items: order_info.order_items.map((item) => ({
      externalProductId: item.app_item_id,
      externalProductName: item.name,
      quantity: item.amount,
      unitPrice: round2(item.total_price / item.amount / 100),
    })),
    rawPayload: orderData,
  };
}
