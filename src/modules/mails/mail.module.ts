import { Module } from "@nestjs/common";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { PasswordRecoveryEmailUseCase } from "@/modules/mails/application/use-cases/password-recovery-email.use-case";
import { UserOnboardingEmailUseCase } from "@/modules/mails/application/use-cases/user-onboarding-email.use-case";
import { BrevoMailProvider } from "@/modules/mails/infrastructure/providers/brevo-mail.provider";

@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: BrevoMailProvider,
    },
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    PasswordChangedEmailUseCase,
  ],
  exports: [
    MAIL_PROVIDER,
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    PasswordChangedEmailUseCase,
  ],
})
export class MailModule {}
