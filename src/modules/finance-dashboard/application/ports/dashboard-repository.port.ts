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
};

export type SalesChannelRow = {
  channel: string;
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

export type MonthlyPoint = {
  month: string; // YYYY-MM
  purchases: number;
  sales: number;
};

export interface DashboardRepositoryPort {
  getTotals(period: DashboardPeriod): Promise<DashboardTotals>;
  getStockValue(idStore: string): Promise<number>;
  getTopProducts(
    period: DashboardPeriod,
    limit: number,
  ): Promise<TopProductRow[]>;
  getProductProfitability(
    period: DashboardPeriod,
  ): Promise<ProductProfitRow[]>;
  getMonthlySeries(period: DashboardPeriod): Promise<MonthlyPoint[]>;
  getSalesByChannel(period: DashboardPeriod): Promise<SalesChannelRow[]>;
}

export const DASHBOARD_REPOSITORY = Symbol("DASHBOARD_REPOSITORY");
