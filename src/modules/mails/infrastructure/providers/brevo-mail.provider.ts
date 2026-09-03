import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import SibApiV3Sdk from "sib-api-v3-sdk";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import type { SendMailCommand } from "@/modules/mails/application/ports/send-mail.command";

@Injectable()
export class BrevoMailProvider implements MailProviderPort {
  private readonly logger = new Logger(BrevoMailProvider.name);
  private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    const apiKeyValue = this.configService.get<string>("BREVO_API_KEY");

    if (!apiKeyValue) {
      this.logger.warn(
        "BREVO_API_KEY não configurada. O envio de email falhará até que a variável seja definida.",
      );
    }

    apiKey.apiKey = apiKeyValue || "";
    this.senderEmail =
      this.configService.get<string>("MAIL_FROM_EMAIL") ||
      "contato.amoremiobr@gmail.com";
    this.senderName =
      this.configService.get<string>("MAIL_FROM_NAME") || "Amore Mio";
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async send(command: SendMailCommand): Promise<void> {
    if (!this.configService.get<string>("BREVO_API_KEY")) {
      throw AppException.from(APP_ERRORS.mails.notConfigured, undefined);
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.to = [
      {
        email: command.to.email,
        name: command.to.name,
      },
    ];
    sendSmtpEmail.subject = command.subject;
    sendSmtpEmail.htmlContent = command.html;
    sendSmtpEmail.textContent = command.text;
    sendSmtpEmail.sender = {
      email: this.senderEmail,
      name: this.senderName,
    };

    if (command.replyTo) {
      sendSmtpEmail.replyTo = {
        email: command.replyTo.email,
        name: command.replyTo.name,
      };
    }

    if (command.attachments?.length) {
      sendSmtpEmail.attachment = command.attachments.map((a) => ({
        name: a.name,
        content: a.content,
      }));
    }

    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }
}
