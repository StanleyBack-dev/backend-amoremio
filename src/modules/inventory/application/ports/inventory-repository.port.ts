import type { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import type { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";
import type { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

export type StockItemView = {
  idProduct: string;
  idStore: string;
  productName: string;
  sku: string | null;
  brand: string | null;
  kind: ProductKind;
  status: boolean;
  unit: UnitOfMeasure;
  quantityOnHand: number;
  averageCost: number;
  stockValue: number;
  reorderPoint: number | null;
  updatedAt: Date | null;
};

export type ListStoreStockFilters = {
  name?: string;
  brand?: string;
  withoutBrand?: boolean;
  kind?: ProductKind;
  unit?: UnitOfMeasure;
  status?: boolean;
  page?: number;
  limit?: number;
};

export type ListStockMovementsFilters = {
  idProduct?: string;
  type?: StockMovementType;
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  records: T[];
  total: number;
};

export type PaginatedStock = Paginated<StockItemView> & {
  // Σ (quantity × average cost) over every row matching the filter.
  valueTotal: number;
};

export type StockMovementView = {
  idStockMovement: string;
  idStore: string;
  idProduct: string;
  productName: string;
  unit: UnitOfMeasure;
  type: StockMovementType;
  quantity: number;
  unitCost: number;
  resultingQuantity: number;
  resultingAverageCost: number;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdByUserId: string;
  occurredAt: Date;
};

export type PersistStockMovementInput = {
  idStore: string;
  idProduct: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number;
  resultingQuantity: number;
  resultingAverageCost: number;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdByUserId: string;
  occurredAt: Date;
};

export type CurrentStock = {
  quantityOnHand: number;
  averageCost: number;
};

export interface InventoryRepositoryPort {
  getCurrentStock(
    idStore: string,
    idProduct: string,
  ): Promise<CurrentStock | null>;

  // Current stock for several products in one query, keyed by idProduct.
  // Products with no stock row are simply absent from the map.
  getCurrentStockBatch(
    idStore: string,
    idProductIds: string[],
  ): Promise<Map<string, CurrentStock>>;

  // Subset of the given ids that actually exist as products in the store.
  findExistingProductIds(
    idStore: string,
    idProductIds: string[],
  ): Promise<Set<string>>;

  // Atomically upserts the stock item snapshot and appends the movement row.
  persistMovement(input: PersistStockMovementInput): Promise<void>;

  // Same as persistMovement but for many movements at once, in a single
  // transaction — one bulk upsert of the affected snapshots and one bulk
  // insert of the movement rows. The caller must pass the movements already
  // ordered and with the resulting quantity/cost computed cumulatively.
  persistMovementsBatch(inputs: PersistStockMovementInput[]): Promise<void>;

  getStockItem(
    idStore: string,
    idProduct: string,
  ): Promise<StockItemView | null>;

  listStoreStock(
    idStore: string,
    filters?: ListStoreStockFilters,
  ): Promise<PaginatedStock>;

  listMovements(
    idStore: string,
    filters?: ListStockMovementsFilters,
  ): Promise<Paginated<StockMovementView>>;

  setReorderPoint(
    idStore: string,
    idProduct: string,
    reorderPoint: number | null,
  ): Promise<void>;
}

export const INVENTORY_REPOSITORY = Symbol("INVENTORY_REPOSITORY");
