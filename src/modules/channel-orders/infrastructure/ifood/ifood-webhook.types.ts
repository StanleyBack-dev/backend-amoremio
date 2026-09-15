// Shape of the fields we actually read from iFood's webhook + Order Details
// API, per the public docs (developer.ifood.com.br → Events → Webhook /
// Order → Order details) and the field names iFood's own client SDKs use.
//
// NOT exhaustive — iFood's real order payload has many more fields
// (delivery, picking, benefits, additionalFees...) that we don't need for
// Fase 2. Confirm this shape against a real sandbox payload before going
// live; the docs/SDK samples are the only source this was built from.

// Every webhook event (PLACED, CONFIRMED, CANCELLED...) shares this thin
// envelope — none of them embed order details, unlike 99Food's orderNew.
export interface IfoodWebhookEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId: string;
  createdAt: string;
  salesChannel?: string;
  metadata?: unknown;
}

export interface IfoodOrderPhone {
  number?: string;
  // Proxy/masked number iFood issues so the merchant can call the customer
  // without seeing their real phone — same privacy-masking idea as
  // 99Food's virtual_phone_number, confirmed as a real field on their SDKs.
  localizer?: string;
}

export interface IfoodOrderCustomer {
  id?: string;
  name?: string;
  phone?: IfoodOrderPhone;
}

export interface IfoodOrderItem {
  id?: string;
  uniqueId?: string;
  externalCode?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IfoodOrderDetail {
  id: string;
  createdAt: string;
  customer?: IfoodOrderCustomer;
  items: IfoodOrderItem[];
}
