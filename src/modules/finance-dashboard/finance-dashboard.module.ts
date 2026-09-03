import { Module } from "@nestjs/common";
import { StoresModule } from "@/modules/stores/stores.module";
import { DASHBOARD_REPOSITORY } from "@/modules/finance-dashboard/application/ports/dashboard-repository.port";
import { GetFinanceDashboardUseCase } from "@/modules/finance-dashboard/application/use-cases/get-finance-dashboard.use-case";
import { DashboardTypeormRepository } from "@/modules/finance-dashboard/infrastructure/persistence/typeorm/repositories/dashboard-typeorm.repository";
import { FinanceDashboardResolver } from "@/modules/finance-dashboard/presentation/graphql/resolvers/finance-dashboard.resolver";

@Module({
  imports: [StoresModule],
  providers: [
    DashboardTypeormRepository,
    { provide: DASHBOARD_REPOSITORY, useExisting: DashboardTypeormRepository },
    GetFinanceDashboardUseCase,
    FinanceDashboardResolver,
  ],
})
export class FinanceDashboardModule {}
