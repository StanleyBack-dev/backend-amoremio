import { Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import {
  RequestInfo,
  type IRequestInfo,
} from "@/common/decorators/request-info.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildSuccessResponse } from "@/common/responses/helpers/response.helper";
import { LogoutResponseDto } from "@/modules/auth/presentation/graphql/dtos/logout/logout-response.dto";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AllowBeforeTermsAcceptance } from "@/modules/auth/presentation/decorators/allow-before-terms-acceptance.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AcceptTermsOfUseUseCase } from "@/modules/legal/application/use-cases/accept-terms-of-use.use-case";
import { GetTermsAcceptanceStatusUseCase } from "@/modules/legal/application/use-cases/get-terms-acceptance-status.use-case";
import { TermsAcceptanceStatusResponseDto } from "@/modules/legal/presentation/graphql/dtos/terms-acceptance-status-response.dto";

@Resolver()
export class LegalResolver {
  constructor(
    private readonly acceptTermsOfUseUseCase: AcceptTermsOfUseUseCase,
    private readonly getTermsAcceptanceStatusUseCase: GetTermsAcceptanceStatusUseCase,
  ) {}

  @Query(() => TermsAcceptanceStatusResponseDto, {
    name: "myTermsAcceptanceStatus",
  })
  @AllowBeforeTermsAcceptance()
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myTermsAcceptanceStatus(@CurrentUser() user: AuthenticatedUser) {
    const status = await this.getTermsAcceptanceStatusUseCase.execute(
      user.idUsers,
    );

    return TermsAcceptanceStatusResponseDto.fromView(status);
  }

  @Mutation(() => LogoutResponseDto, { name: "acceptTermsOfUse" })
  @AllowBeforeTermsAcceptance()
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async acceptTermsOfUse(
    @CurrentUser() user: AuthenticatedUser,
    @RequestInfo() requestInfo: IRequestInfo,
  ): Promise<LogoutResponseDto> {
    await this.acceptTermsOfUseUseCase.execute(user.idUsers, requestInfo);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.legal.termsAccepted,
    ) as LogoutResponseDto;
  }
}
