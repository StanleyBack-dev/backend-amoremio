import type { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import type { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

export class CreateSalesOrderCommand {
  idStore!: string;
  customerName?: string | null;
  orderDate?: Date;
  salesChannel?: SalesChannel;
  notes?: string | null;
}

export class UpdateSalesOrderHeaderCommand {
  idStore!: string;
  idSalesOrder!: string;
  customerName?: string | null;
  orderDate?: Date;
  salesChannel?: SalesChannel;
  commissionPercent?: number;
  discountAmount?: number;
  discountMode?: SalesDiscountMode;
  discountPercent?: number;
  notes?: string | null;
}

export class AddSalesOrderItemCommand {
  idStore!: string;
  idSalesOrder!: string;
  idProduct!: string;
  quantity!: number;
  unitPrice?: number;
}

export class UpdateSalesOrderItemCommand {
  idStore!: string;
  idSalesOrder!: string;
  idSalesOrderItem!: string;
  quantity?: number;
  unitPrice?: number;
}

export class ListSalesOrdersQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  status?: SalesOrderStatus;
  customerName?: string;
  salesChannel?: SalesChannel;
  createdByUserId?: string;
}
