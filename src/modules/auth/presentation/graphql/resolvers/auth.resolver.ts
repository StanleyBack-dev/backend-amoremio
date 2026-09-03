import { Resolver, Mutation, Args, Context } from "@nestjs/graphql";
import { Request, Response } from "express";
import { extractClientIp } from "@/common/utils/extract-client-ip.util";
import { RateLimit } from "@/common/rate-limit/rate-limit-tier.decorator";
import { RateLimitTier } from "@/common/rate-limit/rate-limit-tier.enum";
import { Public } from "@/common/decorators/public.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { buildSuccessResponse } from "@/common/responses/helpers/response.helper";
import { AllowBeforeTermsAcceptance } from "@/modules/auth/presentation/decorators/allow-before-terms-acceptance.decorator";
import { AllowFirstAccess } from "@/modules/auth/presentation/decorators/allow-first-access.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/config/cookie.config";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ChangePasswordInputDto } from "@/modules/auth/presentation/graphql/dtos/password/change-password-input.dto";
import { LoginInputDto } from "@/modules/auth/presentation/graphql/dtos/login/login-input.dto";
import { LogoutResponseDto } from "@/modules/auth/presentation/graphql/dtos/logout/logout-response.dto";
import { RequestPasswordRecoveryInputDto } from "@/modules/auth/presentation/graphql/dtos/password-recovery/request-password-recovery-input.dto";
import { ResetPasswordWithRecoveryInputDto } from "@/modules/auth/presentation/graphql/dtos/password-recovery/reset-password-with-recovery-input.dto";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { VerifyPasswordRecoveryCodeInputDto } from "@/modules/auth/presentation/graphql/dtos/password-recovery/verify-password-recovery-code-input.dto";
import { VerifyPasswordRecoveryCodeMutationResponseDto } from "@/modules/auth/presentation/graphql/dtos/password-recovery/verify-password-recovery-code-mutation-response.dto";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AuthCookieService } from "@/modules/auth/application/use-cases/auth-cookie.use-case";
import { ChangePasswordService } from "@/modules/auth/application/use-cases/change-password.use-case";
import { CompleteOnboardingTourService } from "@/modules/auth/application/use-cases/complete-onboarding-tour.use-case";
import { LoginService } from "@/modules/auth/application/use-cases/login.use-case";
import { LogoutService } from "@/modules/auth/application/use-cases/logout.use-case";
import { RequestPasswordRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/request-password-recovery.use-case";
import { ResetPasswordWithRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/reset-password-with-recovery.use-case";
import { VerifyPasswordRecoveryCodeService } from "@/modules/auth/application/use-cases/password-recovery/verify-password-recovery-code.use-case";
import { RefreshAuthSessionService } from "@/modules/auth/application/use-cases/refresh-auth-session.use-case";

interface GraphqlContext {
  req: Request;
  res: Response;
}

interface RequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly loginUseCase: LoginService,
    private readonly refreshAuthSessionUseCase: RefreshAuthSessionService,
    private readonly logoutUseCase: LogoutService,
    private readonly changePasswordUseCase: ChangePasswordService,
    private readonly completeOnboardingTourUseCase: CompleteOnboardingTourService,
    private readonly requestPasswordRecoveryUseCase: RequestPasswordRecoveryService,
    private readonly verifyPasswordRecoveryCodeUseCase: VerifyPasswordRecoveryCodeService,
    private readonly resetPasswordWithRecoveryUseCase: ResetPasswordWithRecoveryService,
    private readonly authCookieUseCase: AuthCookieService,
  ) {}

  @Public()
  @RateLimit(RateLimitTier.AUTH)
  @Mutation(() => AuthSessionResponseDto, { name: "login" })
  async login(
    @Args("input") input: LoginInputDto,
    @Context() context: GraphqlContext,
  ): Promise<AuthSessionResponseDto> {
    const { accessToken, refreshToken, response } =
      await this.loginUseCase.execute(
        input,
        this.extractRequestInfo(context.req),
      );

    this.authCookieUseCase.setAuthCookies(
      context.res,
      accessToken,
      refreshToken,
    );

    return response;
  }

  @Public()
  @Mutation(() => AuthSessionResponseDto, { name: "refreshAuthSession" })
  async refreshAuthSession(
    @Context() context: GraphqlContext,
  ): Promise<AuthSessionResponseDto> {
    const refreshToken = context.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    const {
      accessToken,
      refreshToken: nextRefreshToken,
      response,
    } = await this.refreshAuthSessionUseCase.execute(refreshToken ?? "");

    this.authCookieUseCase.setAuthCookies(
      context.res,
      accessToken,
      nextRefreshToken,
    );

    return response;
  }

  @Mutation(() => LogoutResponseDto, { name: "logout" })
  @AllowFirstAccess()
  @AllowBeforeTermsAcceptance()
  @RequirePermissions(AuthPermission.LOGOUT)
  async logout(@Context() context: GraphqlContext): Promise<LogoutResponseDto> {
    const refreshToken = context.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as
      | string
      | undefined;

    await this.logoutUseCase.execute(refreshToken);
    this.authCookieUseCase.clearAuthCookies(context.res);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.auth.logout,
    ) as LogoutResponseDto;
  }

  @Mutation(() => LogoutResponseDto, { name: "changeMyPassword" })
  @AllowFirstAccess()
  @AllowBeforeTermsAcceptance()
  @RequirePermissions(AuthPermission.CHANGE_OWN_PASSWORD)
  async changeMyPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ChangePasswordInputDto,
  ): Promise<LogoutResponseDto> {
    await this.changePasswordUseCase.execute(user.idUsers, input);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.auth.passwordChanged,
    ) as LogoutResponseDto;
  }

  @Mutation(() => LogoutResponseDto, { name: "completeOnboardingTour" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async completeOnboardingTour(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LogoutResponseDto> {
    await this.completeOnboardingTourUseCase.execute(user.idUsers);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.auth.onboardingTourCompleted,
    ) as LogoutResponseDto;
  }

  @Public()
  @RateLimit(RateLimitTier.PASSWORD_RECOVERY)
  @Mutation(() => LogoutResponseDto, { name: "requestPasswordRecovery" })
  async requestPasswordRecovery(
    @Args("input") input: RequestPasswordRecoveryInputDto,
  ): Promise<LogoutResponseDto> {
    await this.requestPasswordRecoveryUseCase.execute(input.email);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.auth.passwordRecoveryRequested,
    ) as LogoutResponseDto;
  }

  @Public()
  @RateLimit(RateLimitTier.PASSWORD_RECOVERY)
  @Mutation(() => VerifyPasswordRecoveryCodeMutationResponseDto, {
    name: "verifyPasswordRecoveryCode",
  })
  async verifyPasswordRecoveryCode(
    @Args("input") input: VerifyPasswordRecoveryCodeInputDto,
  ) {
    const result = await this.verifyPasswordRecoveryCodeUseCase.execute(
      input.email,
      input.code,
    );

    return buildDataResponse(
      result,
      RESPONSE_MESSAGES.auth.passwordRecoveryCodeValidated,
    );
  }

  @Public()
  @RateLimit(RateLimitTier.PASSWORD_RECOVERY)
  @Mutation(() => LogoutResponseDto, { name: "resetPasswordWithRecovery" })
  async resetPasswordWithRecovery(
    @Args("input") input: ResetPasswordWithRecoveryInputDto,
  ): Promise<LogoutResponseDto> {
    await this.resetPasswordWithRecoveryUseCase.execute(
      input.recoveryToken,
      input.newPassword,
    );

    return buildSuccessResponse(
      RESPONSE_MESSAGES.auth.passwordRecovered,
    ) as LogoutResponseDto;
  }

  private extractRequestInfo(request: Request): RequestInfo {
    return {
      ipAddress: extractClientIp(request),
      userAgent: request.headers["user-agent"] ?? undefined,
    };
  }
}
