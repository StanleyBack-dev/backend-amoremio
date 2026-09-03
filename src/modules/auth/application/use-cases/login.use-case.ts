import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { LoginInputDto } from "@/modules/auth/presentation/graphql/dtos/login/login-input.dto";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { IssueAuthSessionService } from "./issue-auth-session.use-case";
import { PasswordHasherService } from "./password-hasher.use-case";

interface SessionRequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly issueAuthSessionUseCase: IssueAuthSessionService,
  ) {}

  async execute(
    input: LoginInputDto,
    requestInfo: SessionRequestInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSessionResponseDto;
  }> {
    const credential = await this.authCredentialsUseCase.findByUsername(
      input.username,
    );

    if (!credential) {
      throw AppException.from(APP_ERRORS.auth.invalidCredentials, undefined);
    }

    await this.authCredentialsUseCase.assertNotLocked(credential);

    const passwordMatches = await this.passwordHasherUseCase.verifyPassword(
      input.password,
      credential.passwordHash,
    );

    if (!passwordMatches) {
      await this.authCredentialsUseCase.registerFailedLogin(credential);
      throw AppException.from(APP_ERRORS.auth.invalidCredentials, undefined);
    }

    // Only after the password is confirmed can a self-deactivated account
    // be safely reactivated — see ensureAccountActiveOrReactivate.
    await this.authCredentialsUseCase.ensureAccountActiveOrReactivate(
      credential,
    );

    return this.issueAuthSessionUseCase.execute(credential, requestInfo);
  }
}
