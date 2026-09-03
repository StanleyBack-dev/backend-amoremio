import { GetFinanceDashboardUseCase } from "@/modules/finance-dashboard/application/use-cases/get-finance-dashboard.use-case";

function build() {
  const dashboardRepository = {
    getTotals: jest.fn().mockResolvedValue({
      totalPurchases: 400,
      totalSales: 1000,
      totalCommission: 120,
      netSales: 880,
      costOfGoodsSold: 600,
      grossMargin: 280,
      grossMarginPercent: 31.8,
      purchaseCount: 2,
      salesCount: 5,
    }),
    getStockValue: jest.fn().mockResolvedValue(250),
    getTopProducts: jest.fn().mockResolvedValue([]),
    getProductProfitability: jest.fn().mockResolvedValue([]),
    getMonthlySeries: jest.fn().mockResolvedValue([]),
    getSalesByChannel: jest.fn().mockResolvedValue([]),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new GetFinanceDashboardUseCase(
      dashboardRepository as never,
      auth as never,
    ),
    dashboardRepository,
    auth,
  };
}

describe("GetFinanceDashboardUseCase", () => {
  it("requires VIEW_DASHBOARD and aggregates the sections", async () => {
    const { useCase, auth, dashboardRepository } = build();

    const result = await useCase.execute("user-1", { idStore: "store-1" });

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "VIEW_DASHBOARD",
    );
    expect(result.totals.grossMargin).toBe(280);
    expect(result.totals.netSales).toBe(880);
    expect(result.stockValue).toBe(250);
    expect(dashboardRepository.getTopProducts).toHaveBeenCalledWith(
      expect.objectContaining({ idStore: "store-1" }),
      5,
    );
  });

  it("defaults to a 30 calendar-day window covering all of today", async () => {
    const { useCase, dashboardRepository } = build();

    await useCase.execute("user-1", { idStore: "store-1" });

    const period = dashboardRepository.getTotals.mock.calls[0][0];
    const days = (period.to.getTime() - period.from.getTime()) / 86_400_000;
    // 29 days back + the whole of today.
    expect(Math.round(days)).toBe(30);
    // Both ends land on calendar-day (00:00 UTC) boundaries.
    expect(period.from.getTime() % 86_400_000).toBe(0);
    expect(period.to.getTime() % 86_400_000).toBe(0);
  });
});
