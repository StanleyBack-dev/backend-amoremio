import { Injectable } from "@nestjs/common";
import { CreateSessionUseCase } from "@/modules/sessions/application/use-cases/create/create-session.use-case";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { CURRENT_TERMS_VERSION } from "@/modules/legal/domain/constants/terms-version.constant";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { AuthTokensService } from "./auth-tokens.use-case";

interface SessionRequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class IssueAuthSessionService {
  constructor(
    private readonly authTokensUseCase: AuthTokensService,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly authCredentialsUseCase: AuthCredentialsService,
  ) {}

  async execute(
    credential: AuthCredentialEntity,
    requestInfo: SessionRequestInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSessionResponseDto;
  }> {
    const accessToken = this.authTokensUseCase.signAccessToken(
      credential.user,
      credential.username,
    );
    const refreshToken = this.authTokensUseCase.signRefreshToken(
      credential.user,
      credential.username,
    );

    await this.createSessionUseCase.execute({
      idUsers: credential.idUsers,
      refreshToken,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      refreshTokenExpiresAt: new Date(
        Date.now() + this.authTokensUseCase.getRefreshTokenMaxAgeMs(),
      ),
      lastUsedAt: new Date(),
      sessionActive: true,
    });

    await this.authCredentialsUseCase.registerSuccessfulLogin(credential);

    return {
      accessToken,
      refreshToken,
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
