import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetFinanceDashboardUseCase } from "@/modules/finance-dashboard/application/use-cases/get-finance-dashboard.use-case";
import {
  FinanceDashboardInputDto,
  FinanceDashboardResponseDto,
} from "@/modules/finance-dashboard/presentation/graphql/dtos/finance-dashboard.dtos";

@Resolver()
export class FinanceDashboardResolver {
  constructor(
    private readonly getFinanceDashboardUseCase: GetFinanceDashboardUseCase,
  ) {}

  @Query(() => FinanceDashboardResponseDto, { name: "getFinanceDashboard" })
  async getFinanceDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: FinanceDashboardInputDto,
  ) {
    const result = await this.getFinanceDashboardUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      from: input.from,
      to: input.to,
    });
    return FinanceDashboardResponseDto.fromResult(result);
  }
}
