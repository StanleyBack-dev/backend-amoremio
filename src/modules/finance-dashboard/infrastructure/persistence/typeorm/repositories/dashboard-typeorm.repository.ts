import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  type DashboardPeriod,
  type DashboardRepositoryPort,
  type DashboardTotals,
  type MonthlyPoint,
  type ProductProfitRow,
  type SalesChannelRow,
  type TopProductRow,
} from "@/modules/finance-dashboard/application/ports/dashboard-repository.port";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

@Injectable()
export class DashboardTypeormRepository implements DashboardRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  async getTotals(period: DashboardPeriod): Promise<DashboardTotals> {
    const purchases = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
         FROM tb_purchases
        WHERE idtb_stores = $1 AND status = $2
          AND purchase_date BETWEEN $3 AND $4`,
      [period.idStore, PurchaseStatus.FINALIZADA, period.from, period.to],
    );

    const sales = await this.dataSource.query(
      `SELECT COALESCE(SUM(total), 0) AS total,
              COALESCE(SUM(commission_amount), 0) AS commission,
              COUNT(*) AS count
         FROM tb_sales_orders
        WHERE idtb_stores = $1 AND status = $2
          AND order_date BETWEEN $3 AND $4`,
      [period.idStore, SalesOrderStatus.CONFIRMADA, period.from, period.to],
    );

    const cogs = await this.dataSource.query(
      `SELECT COALESCE(SUM(quantity * unit_cost), 0) AS cogs
         FROM tb_stock_movements
        WHERE idtb_stores = $1 AND type = $2
          AND occurred_at BETWEEN $3 AND $4`,
      [period.idStore, StockMovementType.SAIDA_VENDA, period.from, period.to],
    );

    const totalPurchases = num(purchases[0]?.total);
    const totalSales = num(sales[0]?.total);
    const totalCommission = num(sales[0]?.commission);
    const netSales = num(totalSales - totalCommission);
    const costOfGoodsSold = num(cogs[0]?.cogs);
    // Margin is net of platform commission — the money actually kept on goods.
    const grossMargin = num(netSales - costOfGoodsSold);

    return {
      totalPurchases,
      totalSales,
      totalCommission,
      netSales,
      costOfGoodsSold,
      grossMargin,
      grossMarginPercent:
        netSales > 0 ? num((grossMargin / netSales) * 100) : 0,
      purchaseCount: Number(purchases[0]?.count ?? 0),
      salesCount: Number(sales[0]?.count ?? 0),
    };
  }

  async getSalesByChannel(period: DashboardPeriod): Promise<SalesChannelRow[]> {
    const rows = await this.dataSource.query(
      `SELECT sales_channel AS channel,
              COUNT(*) AS order_count,
              COALESCE(SUM(total), 0) AS gross_sales,
              COALESCE(SUM(commission_amount), 0) AS commission,
              COALESCE(SUM(net_total), 0) AS net_sales
         FROM tb_sales_orders
        WHERE idtb_stores = $1 AND status = $2
          AND order_date BETWEEN $3 AND $4
        GROUP BY sales_channel
        ORDER BY gross_sales DESC`,
      [period.idStore, SalesOrderStatus.CONFIRMADA, period.from, period.to],
    );

    return rows.map((row: Record<string, unknown>) => ({
      channel: String(row.channel),
      orderCount: Number(row.order_count ?? 0),
      grossSales: num(row.gross_sales),
      commission: num(row.commission),
      netSales: num(row.net_sales),
    }));
  }

  async getStockValue(idStore: string): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM(quantity_on_hand * average_cost), 0) AS value
         FROM tb_stock_items
        WHERE idtb_stores = $1`,
      [idStore],
    );
    return num(rows[0]?.value);
  }

  async getTopProducts(
    period: DashboardPeriod,
    limit: number,
  ): Promise<TopProductRow[]> {
    const rows = await this.dataSource.query(
      `SELECT i.idtb_products AS id_product,
              i.product_name    AS product_name,
              COALESCE(SUM(i.quantity), 0)   AS quantity_sold,
              COALESCE(SUM(i.line_total), 0) AS revenue
         FROM tb_sales_order_items i
         JOIN tb_sales_orders o ON o.idtb_sales_orders = i.idtb_sales_orders
        WHERE o.idtb_stores = $1 AND o.status = $2
          AND o.order_date BETWEEN $3 AND $4
        GROUP BY i.idtb_products, i.product_name
        ORDER BY revenue DESC
        LIMIT $5`,
      [
        period.idStore,
        SalesOrderStatus.CONFIRMADA,
        period.from,
        period.to,
        limit,
      ],
    );

    return rows.map((row: Record<string, unknown>) => ({
      idProduct: String(row.id_product),
      productName: String(row.product_name),
      quantitySold: num(row.quantity_sold),
      revenue: num(row.revenue),
    }));
  }

  async getProductProfitability(
    period: DashboardPeriod,
  ): Promise<ProductProfitRow[]> {
    // Revenue + quantity per product, from the confirmed sale lines.
    const revenueRows = await this.dataSource.query(
      `SELECT i.idtb_products AS id_product,
              i.product_name    AS product_name,
              COALESCE(SUM(i.quantity), 0)   AS quantity_sold,
              COALESCE(SUM(i.line_total), 0) AS revenue
         FROM tb_sales_order_items i
         JOIN tb_sales_orders o ON o.idtb_sales_orders = i.idtb_sales_orders
        WHERE o.idtb_stores = $1 AND o.status = $2
          AND o.order_date BETWEEN $3 AND $4
        GROUP BY i.idtb_products, i.product_name`,
      [period.idStore, SalesOrderStatus.CONFIRMADA, period.from, period.to],
    );

    // Cost of goods that left stock on those sales (frozen weighted-average
    // unit cost per movement — carries the ingredient cost of produced goods).
    const costRows = await this.dataSource.query(
      `SELECT idtb_products AS id_product,
              COALESCE(SUM(quantity * unit_cost), 0) AS cost
         FROM tb_stock_movements
        WHERE idtb_stores = $1 AND type = $2
          AND occurred_at BETWEEN $3 AND $4
        GROUP BY idtb_products`,
      [period.idStore, StockMovementType.SAIDA_VENDA, period.from, period.to],
    );

    const commissionRow = await this.dataSource.query(
      `SELECT COALESCE(SUM(commission_amount), 0) AS commission
         FROM tb_sales_orders
        WHERE idtb_stores = $1 AND status = $2
          AND order_date BETWEEN $3 AND $4`,
      [period.idStore, SalesOrderStatus.CONFIRMADA, period.from, period.to],
    );

    const costByProduct = new Map<string, number>();
    for (const row of costRows) {
      costByProduct.set(String(row.id_product), num(row.cost));
    }

    const totalCommission = num(commissionRow[0]?.commission);
    const totalRevenue = revenueRows.reduce(
      (sum: number, row: Record<string, unknown>) => sum + num(row.revenue),
      0,
    );

    const rows: ProductProfitRow[] = revenueRows.map(
      (row: Record<string, unknown>) => {
        const idProduct = String(row.id_product);
        const revenue = num(row.revenue);
        const cost = costByProduct.get(idProduct) ?? 0;
        const commission =
          totalRevenue > 0
            ? num(totalCommission * (revenue / totalRevenue))
            : 0;
        const grossProfit = num(revenue - cost);
        const netProfit = num(grossProfit - commission);
        return {
          idProduct,
          productName: String(row.product_name),
          quantitySold: num(row.quantity_sold),
          revenue,
          cost,
          grossProfit,
          commission,
          netProfit,
          marginPercent: revenue > 0 ? num((netProfit / revenue) * 100) : 0,
        };
      },
    );

    return rows.sort((a, b) => b.netProfit - a.netProfit);
  }

  async getMonthlySeries(period: DashboardPeriod): Promise<MonthlyPoint[]> {
    const purchases = await this.dataSource.query(
      `SELECT to_char(purchase_date, 'YYYY-MM') AS month,
              COALESCE(SUM(total), 0) AS total
         FROM tb_purchases
        WHERE idtb_stores = $1 AND status = $2
          AND purchase_date BETWEEN $3 AND $4
        GROUP BY 1`,
      [period.idStore, PurchaseStatus.FINALIZADA, period.from, period.to],
    );
    const sales = await this.dataSource.query(
      `SELECT to_char(order_date, 'YYYY-MM') AS month,
              COALESCE(SUM(total), 0) AS total
         FROM tb_sales_orders
        WHERE idtb_stores = $1 AND status = $2
          AND order_date BETWEEN $3 AND $4
        GROUP BY 1`,
      [period.idStore, SalesOrderStatus.CONFIRMADA, period.from, period.to],
    );

    const byMonth = new Map<string, MonthlyPoint>();
    for (const row of purchases) {
      byMonth.set(row.month, {
        month: row.month,
        purchases: num(row.total),
        sales: 0,
      });
    }
    for (const row of sales) {
      const existing = byMonth.get(row.month);
      if (existing) {
        existing.sales = num(row.total);
      } else {
        byMonth.set(row.month, {
          month: row.month,
          purchases: 0,
          sales: num(row.total),
        });
      }
    }

    return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  }
}
