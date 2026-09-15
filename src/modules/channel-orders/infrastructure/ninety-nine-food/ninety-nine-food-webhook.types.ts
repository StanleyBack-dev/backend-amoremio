// Shape of the fields we actually read from a 99Food webhook, per the
// public docs (developer-food.99app.com → Order API → Order Webhooks).
// Every id (app_id, order_id, item ids) is a 64-bit integer on their side —
// the controller parses the raw body with json-bigint and keeps these as
// strings end to end, never as JS numbers, to avoid precision loss.
//
// NOT exhaustive — 99Food's real payload has many more fields (delivery
// address, promotions, timestamps...) that we don't need for Fase 1.1.
// Confirm this shape against a real sandbox payload before going live;
// the docs sample is the only source this was built from.

export interface NinetyNineFoodOrderItem {
  app_item_id: string;
  app_external_id?: string;
  name: string;
  total_price: number; // cents, for `amount` units combined
  amount: number;
  // Combo/modifier sub-items — intentionally NOT imported in Fase 1.1 (they
  // price at 0 and would need per-modifier product mapping); only
  // top-level order_items become Venda lines.
  sub_item_list?: unknown[];
}

export interface NinetyNineFoodReceiveAddress {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  virtual_phone_number?: string;
}

export interface NinetyNineFoodOrderData {
  order_id: string;
  order_info: {
    order_id: string;
    order_items: NinetyNineFoodOrderItem[];
    receive_address?: NinetyNineFoodReceiveAddress;
  };
}

export interface NinetyNineFoodWebhookEnvelope {
  app_id: string;
  app_shop_id: string;
  type: string;
  timestamp: number;
  data: NinetyNineFoodOrderData;
}
