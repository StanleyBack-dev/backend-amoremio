import type { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import type { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

export type PurchaseItemView = {
  idPurchaseItem: string;
  idProduct: string;
  productName: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  conversionFactor: number;
  unitPrice: number;
  lineTotal: number;
  baseQuantity: number;
  effectiveUnitCost: number;
};

export type PurchaseView = {
  idPurchase: string;
  idStore: string;
  supplierName: string | null;
  purchaseDate: Date;
  status: PurchaseStatus;
  freightAmount: number;
  discountAmount: number;
  discountMode: PurchaseDiscountMode;
  discountPercent: number;
  itemsSubtotal: number;
  total: number;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: PurchaseItemView[];
};

export type PurchaseUserOption = {
  id: string;
  name: string;
};

export type PurchaseFilterOptions = {
  suppliers: string[];
  creators: PurchaseUserOption[];
};

export type CreatePurchasePayload = {
  idStore: string;
  supplierName: string | null;
  purchaseDate: Date;
  notes: string | null;
  createdByUserId: string;
};

export type UpdatePurchaseHeaderPayload = {
  idPurchase: string;
  supplierName?: string | null;
  purchaseDate?: Date;
  freightAmount?: number;
  discountAmount?: number;
  discountMode?: PurchaseDiscountMode;
  discountPercent?: number;
  notes?: string | null;
};

export type AddPurchaseItemPayload = {
  idPurchase: string;
  idProduct: string;
  productName: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  conversionFactor: number;
  unitPrice: number;
  lineTotal: number;
};

export type UpdatePurchaseItemPayload = {
  idPurchase: string;
  idPurchaseItem: string;
  purchasedQuantity?: number;
  purchasedUnit?: string;
  conversionFactor?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type FinalizePurchasePayload = {
  idPurchase: string;
  itemsSubtotal: number;
  total: number;
  freightAmount: number;
  discountAmount: number;
  finalizedAt: Date;
  items: {
    idPurchaseItem: string;
    baseQuantity: number;
    effectiveUnitCost: number;
  }[];
};

export type ListPurchasesFilters = {
  page?: number;
  limit?: number;
  status?: PurchaseStatus;
  supplierName?: string;
  createdByUserId?: string;
};

export interface PurchaseRepositoryPort {
  create(payload: CreatePurchasePayload): Promise<PurchaseView>;
  findById(idStore: string, idPurchase: string): Promise<PurchaseView | null>;
  listByStore(
    idStore: string,
    filters?: ListPurchasesFilters,
  ): Promise<{ records: PurchaseView[]; total: number }>;
  listFilterOptions(idStore: string): Promise<PurchaseFilterOptions>;
  updateHeader(
    payload: UpdatePurchaseHeaderPayload,
  ): Promise<PurchaseView>;
  addItem(payload: AddPurchaseItemPayload): Promise<PurchaseView>;
  updateItem(payload: UpdatePurchaseItemPayload): Promise<PurchaseView>;
  removeItem(
    idPurchase: string,
    idPurchaseItem: string,
  ): Promise<PurchaseView>;
  setStatus(
    idPurchase: string,
    status: PurchaseStatus,
  ): Promise<PurchaseView>;
  finalize(payload: FinalizePurchasePayload): Promise<PurchaseView>;
}

export const PURCHASE_REPOSITORY = Symbol("PURCHASE_REPOSITORY");
