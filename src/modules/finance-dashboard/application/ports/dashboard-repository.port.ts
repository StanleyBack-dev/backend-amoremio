export type DashboardPeriod = {
  idStore: string;
  from: Date;
  to: Date;
};

export type DashboardTotals = {
  totalPurchases: number;
  totalSales: number;
  // Platform commissions taken off confirmed sales in the period.
  totalCommission: number;
  // totalSales minus totalCommission.
  netSales: number;
  costOfGoodsSold: number;
  grossMargin: number;
  grossMarginPercent: number;
  purchaseCount: number;
  salesCount: number;
  // Cost of insumos consumed by completed production orders in the period
  // (SAIDA_PRODUCAO) — the actual production spend, independent of whether
  // the goods it produced were sold yet.
  productionCost: number;
};

export type SalesChannelRow = {
  channel: string;
  orderCount: number;
  grossSales: number;
  commission: number;
  netSales: number;
};

export type CustomerSalesRow = {
  // Null for legacy/unlinked orders grouped only by their free-text name.
  idCustomer: string | null;
  customerName: string;
  orderCount: number;
  grossSales: number;
  commission: number;
  netSales: number;
};

export type TopProductRow = {
  idProduct: string;
  productName: string;
  quantitySold: number;
  revenue: number;
};

export type ProductProfitRow = {
  idProduct: string;
  productName: string;
  quantitySold: number;
  // Gross revenue for the product in the period (sum of sale-line totals).
  revenue: number;
  // Cost of the ingredients / goods that left stock on those sales.
  cost: number;
  grossProfit: number;
  // Platform commission apportioned to the product by revenue share.
  commission: number;
  netProfit: number;
  // netProfit / revenue, as a percentage.
  marginPercent: number;
};

export type ProductionInputRow = {
  idProduct: string;
  productName: string;
  quantityConsumed: number;
  cost: number;
};

export type DashboardGranularity = "day" | "week" | "month";

export type TimeSeriesPoint = {
  date: string; // ISO bucket start (YYYY-MM-DD)
  purchases: number;
  sales: number;
};

export interface DashboardRepositoryPort {
  getTotals(period: DashboardPeriod): Promise<DashboardTotals>;
  getStockValue(idStore: string): Promise<number>;
  // All-time headcount of active customers — not period-scoped, same as
  // getStockValue (a snapshot of "now", not a range).
  getCustomersCount(idStore: string): Promise<number>;
  getTopProducts(
    period: DashboardPeriod,
    limit: number,
  ): Promise<TopProductRow[]>;
  getProductProfitability(period: DashboardPeriod): Promise<ProductProfitRow[]>;
  getTimeSeries(
    period: DashboardPeriod,
    granularity: DashboardGranularity,
  ): Promise<TimeSeriesPoint[]>;
  getSalesByChannel(period: DashboardPeriod): Promise<SalesChannelRow[]>;
  getSalesByCustomer(
    period: DashboardPeriod,
    limit: number,
  ): Promise<CustomerSalesRow[]>;
  getTopProductionInputs(
    period: DashboardPeriod,
    limit: number,
  ): Promise<ProductionInputRow[]>;
}

export const DASHBOARD_REPOSITORY = Symbol("DASHBOARD_REPOSITORY");
