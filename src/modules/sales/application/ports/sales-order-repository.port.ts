import type { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import type { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import type { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

export type SalesOrderItemView = {
  idSalesOrderItem: string;
  idProduct: string;
  productName: string;
  productKind: ProductKind;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesOrderView = {
  idSalesOrder: string;
  idStore: string;
  customerName: string | null;
  orderDate: Date;
  status: SalesOrderStatus;
  salesChannel: SalesChannel;
  commissionPercent: number;
  commissionAmount: number;
  netTotal: number;
  discountAmount: number;
  discountMode: SalesDiscountMode;
  discountPercent: number;
  itemsSubtotal: number;
  total: number;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: SalesOrderItemView[];
};

export type SalesOrderUserOption = {
  id: string;
  name: string;
};

export type SalesOrderFilterOptions = {
  customers: string[];
  channels: SalesChannel[];
  creators: SalesOrderUserOption[];
};

export type CreateSalesOrderPayload = {
  idStore: string;
  customerName: string | null;
  orderDate: Date;
  salesChannel: SalesChannel;
  notes: string | null;
  createdByUserId: string;
};

export type UpdateSalesOrderHeaderPayload = {
  idSalesOrder: string;
  customerName?: string | null;
  orderDate?: Date;
  salesChannel?: SalesChannel;
  commissionPercent?: number;
  discountAmount?: number;
  discountMode?: SalesDiscountMode;
  discountPercent?: number;
  notes?: string | null;
};

export type AddSalesOrderItemPayload = {
  idSalesOrder: string;
  idProduct: string;
  productName: string;
  productKind: ProductKind;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type UpdateSalesOrderItemPayload = {
  idSalesOrder: string;
  idSalesOrderItem: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type ConfirmSalesOrderPayload = {
  idSalesOrder: string;
  itemsSubtotal: number;
  discountAmount: number;
  total: number;
  commissionPercent: number;
  commissionAmount: number;
  netTotal: number;
  confirmedAt: Date;
};

export type ListSalesOrdersFilters = {
  page?: number;
  limit?: number;
  status?: SalesOrderStatus;
  customerName?: string;
  salesChannel?: SalesChannel;
  createdByUserId?: string;
};

export interface SalesOrderRepositoryPort {
  create(payload: CreateSalesOrderPayload): Promise<SalesOrderView>;
  findById(
    idStore: string,
    idSalesOrder: string,
  ): Promise<SalesOrderView | null>;
  listByStore(
    idStore: string,
    filters?: ListSalesOrdersFilters,
  ): Promise<{ records: SalesOrderView[]; total: number }>;
  updateHeader(payload: UpdateSalesOrderHeaderPayload): Promise<SalesOrderView>;
  addItem(payload: AddSalesOrderItemPayload): Promise<SalesOrderView>;
  updateItem(payload: UpdateSalesOrderItemPayload): Promise<SalesOrderView>;
  removeItem(
    idSalesOrder: string,
    idSalesOrderItem: string,
  ): Promise<SalesOrderView>;
  setStatus(
    idSalesOrder: string,
    status: SalesOrderStatus,
  ): Promise<SalesOrderView>;
  confirm(payload: ConfirmSalesOrderPayload): Promise<SalesOrderView>;
  listFilterOptions(idStore: string): Promise<SalesOrderFilterOptions>;
}

export const SALES_ORDER_REPOSITORY = Symbol("SALES_ORDER_REPOSITORY");
