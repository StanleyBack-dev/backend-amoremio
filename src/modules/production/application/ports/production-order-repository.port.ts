import type { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

export type ProductionOrderItemView = {
  idProductionOrderItem: string;
  idProduct: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCostAtConsumption: number;
  lineCost: number;
};

export type ProductionOrderOutputExtraView = {
  idProductionOrderOutputExtra: string;
  idProduct: string;
  productName: string;
  quantity: number;
  unitCostAtConsumption: number;
  lineCost: number;
};

export type ProductionOrderOutputView = {
  idProductionOrderOutput: string;
  idProduct: string;
  productName: string;
  quantity: number;
  unitCost: number;
  extras: ProductionOrderOutputExtraView[];
};

export type ProductionOrderView = {
  idProductionOrder: string;
  idStore: string;
  idRecipe: string;
  recipeName: string;
  idOutputProduct: string;
  outputProductName: string;
  productionDate: Date;
  status: ProductionOrderStatus;
  batches: number;
  plannedOutputQuantity: number;
  actualOutputQuantity: number;
  laborCost: number;
  overheadCost: number;
  inputsCost: number;
  totalCost: number;
  outputUnitCost: number;
  notes: string | null;
  createdByUserId: string;
  createdByUserName: string | null;
  concludedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: ProductionOrderItemView[];
  outputs: ProductionOrderOutputView[];
};

export type CreateProductionOrderPayload = {
  idStore: string;
  idRecipe: string;
  recipeName: string;
  idOutputProduct: string;
  outputProductName: string;
  productionDate: Date;
  batches: number;
  plannedOutputQuantity: number;
  actualOutputQuantity: number;
  laborCost: number;
  overheadCost: number;
  notes: string | null;
  createdByUserId: string;
  items: {
    idProduct: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
};

export type UpdateProductionOrderPayload = {
  idProductionOrder: string;
  productionDate?: Date;
  batches?: number;
  plannedOutputQuantity?: number;
  actualOutputQuantity?: number;
  laborCost?: number;
  overheadCost?: number;
  notes?: string | null;
  // When the batch count changes the item lines are regenerated wholesale.
  items?: {
    idProduct: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
};

export type CompleteProductionOrderPayload = {
  idProductionOrder: string;
  inputsCost: number;
  totalCost: number;
  outputUnitCost: number;
  actualOutputQuantity: number;
  concludedAt: Date;
  items: {
    idProductionOrderItem: string;
    unitCostAtConsumption: number;
    lineCost: number;
  }[];
  // Updates the already-persisted draft rows in place (see
  // ProductionOrderCrudUseCases.addOutput/addOutputExtra) — completion only
  // ever freezes their cost, it never creates new output/extra rows.
  outputs: {
    idProductionOrderOutput: string;
    unitCost: number;
    extras: {
      idProductionOrderOutputExtra: string;
      unitCostAtConsumption: number;
      lineCost: number;
    }[];
  }[];
};

// Recreates a whole order (items + outputs + extras) as a new draft in a
// single call — see ProductionOrderCrudUseCases.duplicate. Doing this
// server-side collapses what would otherwise be 1 (create) + N (outputs) +
// M (extras) sequential round-trips from the client into one.
export type DuplicateProductionOrderPayload = CreateProductionOrderPayload & {
  outputs: {
    idProduct: string;
    productName: string;
    quantity: number;
    extras: {
      idProduct: string;
      productName: string;
      quantity: number;
    }[];
  }[];
};

export type AddProductionOrderOutputPayload = {
  idProductionOrder: string;
  idProduct: string;
  productName: string;
  quantity: number;
};

export type AddProductionOrderOutputExtraPayload = {
  idProductionOrderOutput: string;
  idProduct: string;
  productName: string;
  quantity: number;
};

export type ListProductionOrdersFilters = {
  page?: number;
  limit?: number;
  status?: ProductionOrderStatus;
  idRecipe?: string;
  createdByUserId?: string;
};

export type ProductionOrderUserOption = {
  id: string;
  name: string;
};

export type ProductionOrderFilterOptions = {
  recipes: ProductionOrderUserOption[];
  creators: ProductionOrderUserOption[];
};

export interface ProductionOrderRepositoryPort {
  createOrder(
    payload: CreateProductionOrderPayload,
  ): Promise<ProductionOrderView>;
  duplicateOrder(
    payload: DuplicateProductionOrderPayload,
  ): Promise<ProductionOrderView>;
  findOrderById(
    idStore: string,
    idProductionOrder: string,
  ): Promise<ProductionOrderView | null>;
  listOrdersByStore(
    idStore: string,
    filters?: ListProductionOrdersFilters,
  ): Promise<{ records: ProductionOrderView[]; total: number }>;
  listOrderFilterOptions(
    idStore: string,
  ): Promise<ProductionOrderFilterOptions>;
  updateOrder(
    payload: UpdateProductionOrderPayload,
  ): Promise<ProductionOrderView>;
  setOrderStatus(
    idProductionOrder: string,
    status: ProductionOrderStatus,
  ): Promise<ProductionOrderView>;
  completeOrder(
    payload: CompleteProductionOrderPayload,
  ): Promise<ProductionOrderView>;

  addOutput(
    payload: AddProductionOrderOutputPayload,
  ): Promise<ProductionOrderView>;
  removeOutput(
    idProductionOrder: string,
    idProductionOrderOutput: string,
  ): Promise<ProductionOrderView>;
  addOutputExtra(
    idProductionOrder: string,
    payload: AddProductionOrderOutputExtraPayload,
  ): Promise<ProductionOrderView>;
  removeOutputExtra(
    idProductionOrder: string,
    idProductionOrderOutput: string,
    idProductionOrderOutputExtra: string,
  ): Promise<ProductionOrderView>;
  removeOrderItem(
    idProductionOrder: string,
    idProductionOrderItem: string,
  ): Promise<ProductionOrderView>;
}

export const PRODUCTION_ORDER_REPOSITORY = Symbol(
  "PRODUCTION_ORDER_REPOSITORY",
);
