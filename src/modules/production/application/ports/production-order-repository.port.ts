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
}

export const PRODUCTION_ORDER_REPOSITORY = Symbol(
  "PRODUCTION_ORDER_REPOSITORY",
);
