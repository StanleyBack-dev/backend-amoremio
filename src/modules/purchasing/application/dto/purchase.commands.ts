import type { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import type { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

export class CreatePurchaseDraftCommand {
  idStore!: string;
  supplierName?: string | null;
  purchaseDate?: Date;
  notes?: string | null;
}

export class UpdatePurchaseHeaderCommand {
  idStore!: string;
  idPurchase!: string;
  supplierName?: string | null;
  purchaseDate?: Date;
  freightAmount?: number;
  discountAmount?: number;
  discountMode?: PurchaseDiscountMode;
  discountPercent?: number;
  notes?: string | null;
}

export class AddPurchaseItemCommand {
  idStore!: string;
  idPurchase!: string;
  idProduct!: string;
  purchasedQuantity!: number;
  purchasedUnit!: string;
  conversionFactor!: number;
  unitPrice!: number;
}

export class UpdatePurchaseItemCommand {
  idStore!: string;
  idPurchase!: string;
  idPurchaseItem!: string;
  purchasedQuantity?: number;
  purchasedUnit?: string;
  conversionFactor?: number;
  unitPrice?: number;
}

export class ListPurchasesQuery {
  idStore!: string;
  page?: number;
  limit?: number;
  status?: PurchaseStatus;
  supplierName?: string;
  createdByUserId?: string;
}
