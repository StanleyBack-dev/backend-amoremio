import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PdfTemplateKey } from "../../domain/enums/pdf-template-key.enum";
import { PdfTemplateRenderer } from "../interfaces/pdf-template-renderer.interface";
import { RenderTabularReportTemplateService } from "../../presentation/templates/financial-table/render-tabular-report-template.service";

interface GenerateByTemplateInput<TPayload> {
  templateKey: PdfTemplateKey;
  payload: TPayload;
}

@Injectable()
export class PdfTemplateEngineService {
  private readonly registry: Map<PdfTemplateKey, PdfTemplateRenderer>;

  constructor(
    private readonly renderTabularReportTemplateUseCase: RenderTabularReportTemplateService,
  ) {
    this.registry = new Map<PdfTemplateKey, PdfTemplateRenderer>([
      [
        this.renderTabularReportTemplateUseCase.templateKey,
        this.renderTabularReportTemplateUseCase,
      ],
    ]);
  }

  async generateByTemplate<TPayload>(
    input: GenerateByTemplateInput<TPayload>,
  ): Promise<Buffer> {
    const renderer = this.registry.get(input.templateKey);

    if (!renderer) {
      throw AppException.from(APP_ERRORS.pdf.templateNotMapped, undefined);
    }

    return renderer.render(input.payload);
  }
}
