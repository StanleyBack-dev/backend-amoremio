import type { SendMailCommand } from "@/modules/mails/application/ports/send-mail.command";

export interface MailProviderPort {
  send(command: SendMailCommand): Promise<void>;
}
