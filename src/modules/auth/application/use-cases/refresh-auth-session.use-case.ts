import { Injectable } from "@nestjs/common";
import { RefreshSessionUseCase } from "@/modules/sessions/application/use-cases/refresh/refresh-session.use-case";
import { SaveSessionUseCase } from "@/modules/sessions/application/use-cases/save/save-session.use-case";
import { ValidateSessionUseCase } from "@/modules/sessions/application/use-cases/validate/validate-session.use-case";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { CURRENT_TERMS_VERSION } from "@/modules/legal/domain/constants/terms-version.constant";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { AuthTokensService } from "./auth-tokens.use-case";

@Injectable()
export class RefreshAuthSessionService {
  constructor(
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly saveSessionUseCase: SaveSessionUseCase,
    private readonly authTokensUseCase: AuthTokensService,
    private readonly authCredentialsUseCase: AuthCredentialsService,
  ) {}

  async execute(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSessionResponseDto;
  }> {
    const payload = this.authTokensUseCase.verifyRefreshToken(refreshToken);
    const session = await this.validateSessionUseCase.execute(
      refreshToken,
      payload.uid,
    );

    if (!session) {
      throw AppException.from(
        APP_ERRORS.auth.invalidOrRevokedSession,
        undefined,
      );
    }

    await this.refreshSessionUseCase.execute(session);

    const credential = await this.authCredentialsUseCase.findByUserId(
      payload.uid,
    );
    if (!credential) {
      throw AppException.from(
        APP_ERRORS.auth.credentialMissingForRefresh,
        undefined,
      );
    }

    const nextAccessToken = this.authTokensUseCase.signAccessToken(
      credential.user,
      credential.username,
    );
    const nextRefreshToken = this.authTokensUseCase.signRefreshToken(
      credential.user,
      credential.username,
    );

    session.refreshToken = nextRefreshToken;
    session.refreshTokenExpiresAt = new Date(
      Date.now() + this.authTokensUseCase.getRefreshTokenMaxAgeMs(),
    );
    session.lastUsedAt = new Date();

    await this.saveSessionUseCase.execute(session);

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      response: {
        authenticated: true,
        mustChangePassword: credential.mustChangePassword,
        onboardingTourCompleted: credential.onboardingTourCompleted,
        termsAccepted:
          Boolean(credential.termsAcceptedAt) &&
          credential.termsAcceptedVersion === CURRENT_TERMS_VERSION,
        isTermsReacceptance:
          Boolean(credential.termsAcceptedAt) &&
          credential.termsAcceptedVersion !== CURRENT_TERMS_VERSION,
        user: {
          idUsers: credential.user.idUsers,
          name: credential.user.name,
          email: credential.user.email,
          username: credential.username,
          group: credential.user.group,
          status: credential.user.status,
          urlAvatar: credential.user.urlAvatar,
        },
      },
    };
  }
}
