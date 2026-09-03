export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailAttachment {
  name: string;
  content: string; // base64
  type: string; // mime type
}

export interface SendMailCommand {
  to: MailAddress;
  subject: string;
  html: string;
  text?: string;
  replyTo?: MailAddress;
  attachments?: MailAttachment[];
}
