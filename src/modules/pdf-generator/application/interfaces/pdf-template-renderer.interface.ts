import type { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";

export interface PdfTemplateRenderer<TPayload = unknown> {
  readonly templateKey: PdfTemplateKey;
  render(payload: TPayload): Promise<Buffer>;
}
