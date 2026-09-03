import { Module } from "@nestjs/common";
import { PdfSnapshotHashService } from "./application/use-cases/pdf-snapshot-hash.use-case";
import { PdfTemplateEngineService } from "./application/use-cases/pdf-template-engine.use-case";
import { RenderTabularReportTemplateService } from "./presentation/templates/financial-table/render-tabular-report-template.service";

@Module({
  providers: [
    PdfSnapshotHashService,
    PdfTemplateEngineService,
    RenderTabularReportTemplateService,
  ],
  exports: [PdfSnapshotHashService, PdfTemplateEngineService],
})
export class PdfGeneratorModule {}
