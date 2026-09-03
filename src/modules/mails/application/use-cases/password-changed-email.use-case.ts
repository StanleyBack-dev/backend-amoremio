import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildPasswordChangedEmail } from "@/modules/mails/presentation/templates/security/password-changed-email.template";

interface SendPasswordChangedEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class PasswordChangedEmailUseCase {
  private readonly logger = new Logger(PasswordChangedEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendPasswordChangedEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildPasswordChangedEmail({
      name: input.name,
      changedAt: new Date(),
      appUrl,
    });

    try {
      await this.mailProvider.send({
        to: {
          email: input.to,
          name: input.name,
        },
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        replyTo: this.buildReplyTo(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha no envio de email de senha alterada para ${input.to}: ${message}`,
      );
    }
  }

  private buildReplyTo() {
    const replyToEmail = this.configService.get<string>("MAIL_REPLY_TO_EMAIL");

    if (!replyToEmail) {
      return undefined;
    }

    return {
      email: replyToEmail,
      name:
        this.configService.get<string>("MAIL_REPLY_TO_NAME") ||
        this.configService.get<string>("MAIL_FROM_NAME") ||
        "Amore Mio",
    };
  }
}
