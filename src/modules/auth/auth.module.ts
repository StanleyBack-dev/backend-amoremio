import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "../../common/guards/auth.guards";
import { MailModule } from "@/modules/mails/mail.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthResolver } from "./presentation/graphql/resolvers/auth.resolver";
import { AuthPermissionsGuard } from "./presentation/guards/auth-permissions.guard";
import { FirstAccessGuard } from "./presentation/guards/first-access.guard";
import { PageAccessGuard } from "./presentation/guards/page-access.guard";
import { TermsAcceptanceGuard } from "./presentation/guards/terms-acceptance.guard";
import { AuthCredentialEntity } from "./infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AuthVerificationCodeEntity } from "./infrastructure/persistence/typeorm/entities/auth-verification-code.entity";
import { UserPageAccessEntity } from "./infrastructure/persistence/typeorm/entities/user-page-access.entity";
import { AuthCookieService } from "./application/use-cases/auth-cookie.use-case";
import { AuthCredentialsService } from "./application/use-cases/auth-credentials.use-case";
import { AuthTokensService } from "./application/use-cases/auth-tokens.use-case";
import { AuthorizationService } from "./application/use-cases/authorization.use-case";
import { PageAccessMetadataResolver } from "./presentation/graphql/resolvers/page-access-metadata.resolver";
import { ChangePasswordService } from "./application/use-cases/change-password.use-case";
import { CompleteOnboardingTourService } from "./application/use-cases/complete-onboarding-tour.use-case";
import { LoginService } from "./application/use-cases/login.use-case";
import { LogoutService } from "./application/use-cases/logout.use-case";
import { PasswordHasherService } from "./application/use-cases/password-hasher.use-case";
import { IssueAuthSessionService } from "./application/use-cases/issue-auth-session.use-case";
import { PasswordRecoveryCodesService } from "./application/use-cases/password-recovery/password-recovery-codes.use-case";
import { RequestPasswordRecoveryService } from "./application/use-cases/password-recovery/request-password-recovery.use-case";
import { ResetPasswordWithRecoveryService } from "./application/use-cases/password-recovery/reset-password-with-recovery.use-case";
import { ProvisionAuthCredentialsService } from "./application/use-cases/provision-auth-credentials.use-case";
import { RefreshAuthSessionService } from "./application/use-cases/refresh-auth-session.use-case";
import { AuthBootstrapService } from "./application/use-cases/auth-bootstrap.use-case";
import { VerifyPasswordRecoveryCodeService } from "./application/use-cases/password-recovery/verify-password-recovery-code.use-case";
import "@/modules/auth/presentation/graphql/enums/auth-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthCredentialEntity,
      AuthVerificationCodeEntity,
      UserPageAccessEntity,
      UserEntity,
    ]),
    MailModule,
    SessionsModule,
  ],
  providers: [
    AuthResolver,
    AuthBootstrapService,
    AuthorizationService,
    PageAccessMetadataResolver,
    AuthCookieService,
    AuthCredentialsService,
    AuthTokensService,
    ChangePasswordService,
    CompleteOnboardingTourService,
    LoginService,
    LogoutService,
    PasswordHasherService,
    IssueAuthSessionService,
    PasswordRecoveryCodesService,
    RequestPasswordRecoveryService,
    ResetPasswordWithRecoveryService,
    ProvisionAuthCredentialsService,
    RefreshAuthSessionService,
    VerifyPasswordRecoveryCodeService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthPermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PageAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FirstAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TermsAcceptanceGuard,
    },
  ],
  exports: [
    AuthCredentialsService,
    AuthTokensService,
    AuthorizationService,
    PasswordHasherService,
    ProvisionAuthCredentialsService,
    AuthCookieService,
    IssueAuthSessionService,
  ],
})
export class AuthModule {}
