import { Module } from "@nestjs/common";
import { RenderTabularWorkbookService } from "./application/use-cases/render-tabular-workbook.use-case";

@Module({
  providers: [RenderTabularWorkbookService],
  exports: [RenderTabularWorkbookService],
})
export class ExcelGeneratorModule {}
