import { Inject, Injectable } from "@nestjs/common";
import { currentDateOnly } from "@/common/utils/date.util";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  DASHBOARD_REPOSITORY,
  type CustomerSalesRow,
  type DashboardGranularity,
  type DashboardRepositoryPort,
  type DashboardTotals,
  type ProductionInputRow,
  type ProductProfitRow,
  type SalesChannelRow,
  type TimeSeriesPoint,
  type TopProductRow,
} from "@/modules/finance-dashboard/application/ports/dashboard-repository.port";

export interface FinanceDashboardResult {
  from: Date;
  to: Date;
  totals: DashboardTotals;
  stockValue: number;
  customersCount: number;
  // Cost of confirmed-sale lines with zero unit price (colher, canudo,
  // saco, balinha…) — derived from productProfitability, not a separate
  // query: real money spent that never shows up in "Top produtos por
  // receita" because there is no revenue to rank by.
  giveawaysCost: number;
  topProducts: TopProductRow[];
  productProfitability: ProductProfitRow[];
  topProductionInputs: ProductionInputRow[];
  granularity: DashboardGranularity;
  timeSeries: TimeSeriesPoint[];
  salesByChannel: SalesChannelRow[];
  salesByCustomer: CustomerSalesRow[];
}

export interface GetFinanceDashboardQuery {
  idStore: string;
  from?: Date;
  to?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Short ranges read best day-by-day; longer ones would otherwise render an
// unreadable number of points, so they step up to weekly/monthly buckets.
function granularityFor(from: Date, to: Date): DashboardGranularity {
  const spanDays = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  if (spanDays <= 31) return "day";
  if (spanDays <= 180) return "week";
  return "month";
}

@Injectable()
export class GetFinanceDashboardUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: GetFinanceDashboardQuery,
  ): Promise<FinanceDashboardResult> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.VIEW_DASHBOARD,
    );

    // Window on whole calendar days in the store timezone: `to` covers all of
    // today (records stored as a bare `date` sit at 00:00, and one created
    // late in the local evening can land on tomorrow's UTC date), `from`
    // starts at the beginning of the day 29 days back.
    const today = currentDateOnly();
    const to = query.to ?? new Date(today.getTime() + DAY_MS);
    const from = query.from ?? new Date(today.getTime() - 29 * DAY_MS);
    const period = { idStore: query.idStore, from, to };
    const granularity = granularityFor(from, to);

    const [
      totals,
      stockValue,
      customersCount,
      topProducts,
      productProfitability,
      topProductionInputs,
      timeSeries,
      salesByChannel,
      salesByCustomer,
    ] = await Promise.all([
      this.dashboardRepository.getTotals(period),
      this.dashboardRepository.getStockValue(query.idStore),
      this.dashboardRepository.getCustomersCount(query.idStore),
      this.dashboardRepository.getTopProducts(period, 8),
      this.dashboardRepository.getProductProfitability(period),
      this.dashboardRepository.getTopProductionInputs(period, 8),
      this.dashboardRepository.getTimeSeries(period, granularity),
      this.dashboardRepository.getSalesByChannel(period),
      this.dashboardRepository.getSalesByCustomer(period, 8),
    ]);

    const giveawaysCost = productProfitability
      .filter((row) => row.revenue === 0)
      .reduce((sum, row) => sum + row.cost, 0);

    return {
      from,
      to,
      totals,
      stockValue,
      customersCount,
      giveawaysCost: Math.round(giveawaysCost * 100) / 100,
      topProducts,
      productProfitability,
      topProductionInputs,
      granularity,
      timeSeries,
      salesByChannel,
      salesByCustomer,
    };
  }
}
