import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  EXCEL_COLORS,
  EXCEL_LAYOUT,
} from "../../infrastructure/design-system/excel-design-system";

const HORIZONTAL_ALIGN_BY_COLUMN_ALIGN: Record<
  string,
  ExcelJS.Alignment["horizontal"]
> = {
  left: "left",
  center: "center",
  right: "right",
};

@Injectable()
export class RenderTabularWorkbookService {
  async render(payload: TabularReportPayload): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Amore Mio";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      this.buildSheetName(payload.documentTitle),
    );
    const columnCount = payload.columns.length;

    this.setColumnWidths(sheet, payload);
    this.drawTitleBlock(sheet, payload, columnCount);

    const headerRowNumber = sheet.lastRow ? sheet.lastRow.number + 1 : 1;

    if (payload.rows.length === 0) {
      this.drawEmptyState(sheet, payload, columnCount);
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    this.drawTableHeader(sheet, payload);
    this.drawRows(sheet, payload);

    if (payload.totals.length > 0) {
      this.drawTotals(sheet, payload, columnCount);
    }

    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private buildSheetName(documentTitle: string): string {
    // Excel sheet names are capped at 31 characters and cannot contain: \ / ? * [ ]
    const sanitized = documentTitle.replace(/[\\/?*[\]]/g, " ").trim();
    return sanitized.slice(0, 31) || "Relatório";
  }

  private setColumnWidths(
    sheet: ExcelJS.Worksheet,
    payload: TabularReportPayload,
  ) {
    sheet.columns = payload.columns.map((column) => ({
      width: Math.min(
        EXCEL_LAYOUT.maxColumnWidth,
        Math.max(
          EXCEL_LAYOUT.minColumnWidth,
          column.weight * EXCEL_LAYOUT.widthPerWeightUnit,
        ),
      ),
    }));
  }

  private drawTitleBlock(
    sheet: ExcelJS.Worksheet,
    payload: TabularReportPayload,
    columnCount: number,
  ) {
    this.addMergedRow(sheet, "AMORE MIO", columnCount, {
      bold: true,
      size: 14,
      color: EXCEL_COLORS.purpleDark,
    });
    this.addMergedRow(sheet, payload.documentTitle, columnCount, {
      bold: true,
      size: 12,
      color: EXCEL_COLORS.text,
    });

    if (payload.documentSubtitle) {
      this.addMergedRow(sheet, payload.documentSubtitle, columnCount, {
        size: 10,
        color: EXCEL_COLORS.textMuted,
      });
    }

    this.addMergedRow(
      sheet,
      `${payload.userLabel} · ${payload.generatedAtLabel}`,
      columnCount,
      { size: 9, color: EXCEL_COLORS.textMuted },
    );

    sheet.addRow([]);
  }

  private addMergedRow(
    sheet: ExcelJS.Worksheet,
    text: string,
    columnCount: number,
    style: { bold?: boolean; size: number; color: string },
  ) {
    const row = sheet.addRow([text]);
    if (columnCount > 1) {
      sheet.mergeCells(row.number, 1, row.number, columnCount);
    }

    const cell = row.getCell(1);
    cell.font = {
      bold: style.bold ?? false,
      size: style.size,
      color: { argb: style.color },
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  }

  private drawEmptyState(
    sheet: ExcelJS.Worksheet,
    payload: TabularReportPayload,
    columnCount: number,
  ) {
    this.addMergedRow(sheet, payload.emptyStateLabel, columnCount, {
      size: 10,
      color: EXCEL_COLORS.textMuted,
    });
  }

  private drawTableHeader(
    sheet: ExcelJS.Worksheet,
    payload: TabularReportPayload,
  ) {
    const row = sheet.addRow(payload.columns.map((column) => column.label));

    row.eachCell((cell, colNumber) => {
      const column = payload.columns[colNumber - 1];
      cell.font = {
        bold: true,
        size: 9,
        color: { argb: EXCEL_COLORS.textMuted },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_COLORS.bgLight },
      };
      cell.alignment = {
        horizontal: HORIZONTAL_ALIGN_BY_COLUMN_ALIGN[column?.align ?? "left"],
        vertical: "middle",
      };
      cell.border = this.thinBorder();
    });
  }

  private drawRows(sheet: ExcelJS.Worksheet, payload: TabularReportPayload) {
    payload.rows.forEach((rowValues, index) => {
      const row = sheet.addRow(rowValues);
      const isEvenRow = index % 2 === 0;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const column = payload.columns[colNumber - 1];
        cell.font = { size: 9, color: { argb: EXCEL_COLORS.text } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: isEvenRow ? EXCEL_COLORS.white : EXCEL_COLORS.rowAlt,
          },
        };
        cell.alignment = {
          horizontal: HORIZONTAL_ALIGN_BY_COLUMN_ALIGN[column?.align ?? "left"],
          vertical: "middle",
          wrapText: true,
        };
        cell.border = this.thinBorder();
      });
    });
  }

  private drawTotals(
    sheet: ExcelJS.Worksheet,
    payload: TabularReportPayload,
    columnCount: number,
  ) {
    for (const total of payload.totals) {
      const row = sheet.addRow([]);
      const labelEndColumn = Math.max(1, columnCount - 1);

      row.getCell(1).value = total.label;
      if (labelEndColumn > 1) {
        sheet.mergeCells(row.number, 1, row.number, labelEndColumn);
      }
      row.getCell(labelEndColumn).font = {
        bold: true,
        size: 10,
        color: { argb: EXCEL_COLORS.text },
      };
      row.getCell(labelEndColumn).alignment = { horizontal: "right" };

      const valueCell = row.getCell(columnCount);
      valueCell.value = total.value;
      valueCell.font = {
        bold: true,
        size: 10,
        color: { argb: EXCEL_COLORS.text },
      };
      valueCell.alignment = { horizontal: "right" };

      for (let colNumber = 1; colNumber <= columnCount; colNumber += 1) {
        row.getCell(colNumber).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_COLORS.bgLight },
        };
      }
    }
  }

  private thinBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      left: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      right: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    };
  }
}
