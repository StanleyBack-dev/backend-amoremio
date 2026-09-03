import { Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  Color,
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
} from "pdf-lib";
import { wrapText } from "@/utils/pdf";
import {
  TabularReportColumn,
  TabularReportPayload,
} from "@/common/interfaces/tabular-report-payload.interface";
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_LAYOUT,
} from "../../../infrastructure/design-system/pdf-design-system";
import { PdfTemplateKey } from "../../../domain/enums/pdf-template-key.enum";
import { PdfTemplateRenderer } from "../../../application/interfaces/pdf-template-renderer.interface";

const HEADER_HEIGHT = 84;
const LOGO_SIZE = 44;
const META_BOX_WIDTH = 190;
const HEADER_DIVIDER_Y = PDF_LAYOUT.pageHeight - 100;
const CONTENT_START_Y = HEADER_DIVIDER_Y - 20;
const FOOTER_RESERVED_HEIGHT = 56;
const CELL_PADDING_X = 8;
const ROW_LINE_HEIGHT = 11;
const ROW_PADDING_Y = 6;
const TOTALS_BOX_WIDTH = 220;
const LOGO_IMAGE_PATH = resolve(
  process.cwd(),
  "src/assets/images/amoremio-logo.png",
);

interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
}

interface HeaderAssets {
  logo?: PDFImage;
}

interface RenderState {
  document: PDFDocument;
  page: PDFPage;
  pages: PDFPage[];
  cursorY: number;
  rowCount: number;
}

interface ColumnLayout extends TabularReportColumn {
  x: number;
  width: number;
}

@Injectable()
export class RenderTabularReportTemplateService implements PdfTemplateRenderer<TabularReportPayload> {
  readonly templateKey = PdfTemplateKey.FINANCIAL_TABLE;

  async render(payload: TabularReportPayload): Promise<Buffer> {
    const document = await PDFDocument.create();
    const fonts = await this.loadFonts(document);
    const headerAssets = await this.loadHeaderAssets(document);
    const state = this.createState(document);
    const columns = this.layoutColumns(payload.columns);

    this.drawHeader(state.page, fonts, payload, headerAssets);
    state.cursorY = CONTENT_START_Y;

    if (payload.rows.length === 0) {
      this.drawEmptyState(state, fonts, payload.emptyStateLabel);
    } else {
      this.drawTableHeader(state, fonts, columns);
      for (const row of payload.rows) {
        this.drawRow(state, fonts, columns, row);
      }

      if (payload.totals.length > 0) {
        this.drawTotals(state, fonts, payload.totals);
      }
    }

    for (let index = 0; index < state.pages.length; index += 1) {
      this.drawFooter(
        state.pages[index],
        fonts,
        payload,
        `${index + 1}/${state.pages.length}`,
      );
    }

    const pdfBytes = await document.save();
    return Buffer.from(pdfBytes);
  }

  private layoutColumns(columns: TabularReportColumn[]): ColumnLayout[] {
    const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);
    let x = PDF_LAYOUT.marginX;

    return columns.map((column) => {
      const width = (PDF_LAYOUT.contentWidth * column.weight) / totalWeight;
      const layout: ColumnLayout = { ...column, x, width };
      x += width;
      return layout;
    });
  }

  private async loadFonts(document: PDFDocument): Promise<FontSet> {
    const [regular, bold] = await Promise.all([
      document.embedFont(StandardFonts.Helvetica),
      document.embedFont(StandardFonts.HelveticaBold),
    ]);

    return { regular, bold };
  }

  private async loadHeaderAssets(document: PDFDocument): Promise<HeaderAssets> {
    try {
      const logoBytes = await readFile(LOGO_IMAGE_PATH);
      const logo = await document.embedPng(logoBytes);
      return { logo };
    } catch {
      return {};
    }
  }

  private createState(document: PDFDocument): RenderState {
    const page = document.addPage([
      PDF_LAYOUT.pageWidth,
      PDF_LAYOUT.pageHeight,
    ]);
    this.paintPageBackground(page);

    return {
      document,
      page,
      pages: [page],
      cursorY: CONTENT_START_Y,
      rowCount: 0,
    };
  }

  private paintPageBackground(page: PDFPage) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PDF_LAYOUT.pageWidth,
      height: PDF_LAYOUT.pageHeight,
      color: PDF_COLORS.white,
    });

    page.drawRectangle({
      x: 0,
      y: PDF_LAYOUT.pageHeight - HEADER_HEIGHT,
      width: PDF_LAYOUT.pageWidth,
      height: HEADER_HEIGHT,
      color: PDF_COLORS.bgLight,
    });

    page.drawRectangle({
      x: 0,
      y: PDF_LAYOUT.pageHeight - 5,
      width: PDF_LAYOUT.pageWidth,
      height: 5,
      color: PDF_COLORS.gold,
    });
  }

  private addPage(state: RenderState): PDFPage {
    const page = state.document.addPage([
      PDF_LAYOUT.pageWidth,
      PDF_LAYOUT.pageHeight,
    ]);
    this.paintPageBackground(page);
    state.page = page;
    state.pages.push(page);
    state.cursorY = CONTENT_START_Y;
    return page;
  }

  private ensureSpace(state: RenderState, requiredHeight: number) {
    if (state.cursorY - requiredHeight < FOOTER_RESERVED_HEIGHT) {
      this.addPage(state);
    }
  }

  private drawHeader(
    page: PDFPage,
    fonts: FontSet,
    payload: TabularReportPayload,
    headerAssets: HeaderAssets,
  ) {
    const logoX = PDF_LAYOUT.marginX;
    const logoY = PDF_LAYOUT.pageHeight - 58;

    if (headerAssets.logo) {
      this.drawLogoImage(page, headerAssets.logo, logoX, logoY);
    }

    const textX = logoX + LOGO_SIZE + 14;
    page.drawText("AMORE MIO", {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 40,
      font: fonts.bold,
      size: 16,
      color: PDF_COLORS.purpleDark,
    });

    page.drawText(payload.documentTitle, {
      x: textX,
      y: PDF_LAYOUT.pageHeight - 56,
      font: fonts.bold,
      size: 11,
      color: PDF_COLORS.text,
    });

    if (payload.documentSubtitle) {
      page.drawText(payload.documentSubtitle, {
        x: textX,
        y: PDF_LAYOUT.pageHeight - 70,
        font: fonts.regular,
        size: PDF_FONT_SIZES.small,
        color: PDF_COLORS.textMuted,
      });
    }

    const metaBoxX = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - META_BOX_WIDTH;
    const metaTopY = PDF_LAYOUT.pageHeight - 34;

    page.drawText(payload.userLabel, {
      x: metaBoxX,
      y: metaTopY,
      font: fonts.bold,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.text,
    });

    page.drawText(payload.generatedAtLabel, {
      x: metaBoxX,
      y: metaTopY - 12,
      font: fonts.regular,
      size: PDF_FONT_SIZES.small,
      color: PDF_COLORS.textMuted,
    });

    page.drawLine({
      start: { x: PDF_LAYOUT.marginX, y: HEADER_DIVIDER_Y },
      end: {
        x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX,
        y: HEADER_DIVIDER_Y,
      },
      thickness: 1,
      color: PDF_COLORS.border,
    });
  }

  private drawLogoImage(page: PDFPage, logo: PDFImage, x: number, y: number) {
    const scale = Math.min(LOGO_SIZE / logo.width, LOGO_SIZE / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;

    page.drawImage(logo, {
      x: x + (LOGO_SIZE - width) / 2,
      y: y + (LOGO_SIZE - height) / 2,
      width,
      height,
    });
  }

  private drawEmptyState(state: RenderState, fonts: FontSet, label: string) {
    const size = PDF_FONT_SIZES.body;
    const width = fonts.regular.widthOfTextAtSize(label, size);
    state.page.drawText(label, {
      x: (PDF_LAYOUT.pageWidth - width) / 2,
      y: state.cursorY - 20,
      font: fonts.regular,
      size,
      color: PDF_COLORS.textMuted,
    });
  }

  private measureHeaderHeight(
    fonts: FontSet,
    columns: ColumnLayout[],
  ): { height: number; wrappedLabels: string[][] } {
    const wrappedLabels = columns.map((column) =>
      wrapText(
        column.label,
        column.width - CELL_PADDING_X * 2,
        fonts.bold,
        PDF_FONT_SIZES.small,
      ),
    );
    const lineCount = Math.max(
      1,
      ...wrappedLabels.map((lines) => lines.length),
    );

    return {
      height: lineCount * ROW_LINE_HEIGHT + ROW_PADDING_Y,
      wrappedLabels,
    };
  }

  private drawTableHeader(
    state: RenderState,
    fonts: FontSet,
    columns: ColumnLayout[],
  ) {
    const { height, wrappedLabels } = this.measureHeaderHeight(fonts, columns);
    this.ensureSpace(state, height);
    const bottomY = state.cursorY - height;

    state.page.drawRectangle({
      x: PDF_LAYOUT.marginX,
      y: bottomY,
      width: PDF_LAYOUT.contentWidth,
      height,
      color: PDF_COLORS.bgLight,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
    });

    columns.forEach((column, index) => {
      let lineY = state.cursorY - ROW_LINE_HEIGHT;
      for (const line of wrappedLabels[index]) {
        this.drawCellText(
          state.page,
          fonts.bold,
          line,
          column,
          lineY,
          PDF_FONT_SIZES.small,
          PDF_COLORS.textMuted,
        );
        lineY -= ROW_LINE_HEIGHT;
      }
    });

    state.cursorY = bottomY;
  }

  private measureRowHeight(
    fonts: FontSet,
    columns: ColumnLayout[],
    row: string[],
  ): { height: number; wrappedCells: string[][] } {
    const wrappedCells = columns.map((column, index) =>
      wrapText(
        row[index] ?? "",
        column.width - CELL_PADDING_X * 2,
        fonts.regular,
        PDF_FONT_SIZES.body,
      ),
    );
    const lineCount = Math.max(1, ...wrappedCells.map((lines) => lines.length));

    return {
      height: lineCount * ROW_LINE_HEIGHT + ROW_PADDING_Y,
      wrappedCells,
    };
  }

  private drawRow(
    state: RenderState,
    fonts: FontSet,
    columns: ColumnLayout[],
    row: string[],
  ) {
    const { height, wrappedCells } = this.measureRowHeight(fonts, columns, row);

    if (state.cursorY - height < FOOTER_RESERVED_HEIGHT) {
      this.addPage(state);
      this.drawTableHeader(state, fonts, columns);
    }

    const bottomY = state.cursorY - height;
    const isEvenRow = state.rowCount % 2 === 0;
    state.rowCount += 1;

    state.page.drawRectangle({
      x: PDF_LAYOUT.marginX,
      y: bottomY,
      width: PDF_LAYOUT.contentWidth,
      height,
      color: isEvenRow ? PDF_COLORS.white : PDF_COLORS.rowAlt,
      borderColor: PDF_COLORS.border,
      borderWidth: 0.6,
    });

    columns.forEach((column, index) => {
      let lineY = state.cursorY - ROW_LINE_HEIGHT;
      for (const line of wrappedCells[index]) {
        this.drawCellText(
          state.page,
          fonts.regular,
          line,
          column,
          lineY,
          PDF_FONT_SIZES.body,
          PDF_COLORS.text,
        );
        lineY -= ROW_LINE_HEIGHT;
      }
    });

    state.cursorY = bottomY;
  }

  private drawCellText(
    page: PDFPage,
    font: PDFFont,
    text: string,
    column: ColumnLayout,
    y: number,
    size: number,
    color: Color,
  ) {
    const textWidth = font.widthOfTextAtSize(text, size);
    let x = column.x + CELL_PADDING_X;

    if (column.align === "right") {
      x = column.x + column.width - CELL_PADDING_X - textWidth;
    } else if (column.align === "center") {
      x = column.x + (column.width - textWidth) / 2;
    }

    page.drawText(text, { x, y, font, size, color });
  }

  private drawTotals(
    state: RenderState,
    fonts: FontSet,
    totals: TabularReportPayload["totals"],
  ) {
    const rowHeight = 16;
    const height = totals.length * rowHeight + 12;
    this.ensureSpace(state, height + 10);

    state.cursorY -= 10;
    const x = PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - TOTALS_BOX_WIDTH;
    const topY = state.cursorY;
    const bottomY = topY - height;

    state.page.drawRectangle({
      x,
      y: bottomY,
      width: TOTALS_BOX_WIDTH,
      height,
      borderColor: PDF_COLORS.border,
      borderWidth: 1,
      color: PDF_COLORS.bgLight,
    });

    let y = topY - 16;
    totals.forEach((total, index) => {
      const isLast = index === totals.length - 1;
      const font = isLast ? fonts.bold : fonts.regular;
      const size = isLast ? 11 : PDF_FONT_SIZES.body;

      state.page.drawText(total.label, {
        x: x + 14,
        y,
        font,
        size,
        color: PDF_COLORS.text,
      });

      const valueWidth = font.widthOfTextAtSize(total.value, size);
      state.page.drawText(total.value, {
        x: x + TOTALS_BOX_WIDTH - 14 - valueWidth,
        y,
        font,
        size,
        color: PDF_COLORS.text,
      });

      y -= rowHeight;
    });

    state.cursorY = bottomY;
  }

  private drawFooter(
    page: PDFPage,
    fonts: FontSet,
    payload: TabularReportPayload,
    pageCounter: string,
  ) {
    const startY = 40;

    page.drawLine({
      start: { x: PDF_LAYOUT.marginX, y: startY + 14 },
      end: { x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX, y: startY + 14 },
      thickness: 1,
      color: PDF_COLORS.border,
    });

    page.drawText("Amore Mio — relatório gerado automaticamente", {
      x: PDF_LAYOUT.marginX,
      y: startY,
      font: fonts.regular,
      size: PDF_FONT_SIZES.micro,
      color: PDF_COLORS.textLight,
    });

    const footerRight = `Ref. ${payload.referenceCode.slice(0, 28)}  Pag. ${pageCounter}`;
    const footerRightWidth = fonts.regular.widthOfTextAtSize(
      footerRight,
      PDF_FONT_SIZES.micro,
    );
    page.drawText(footerRight, {
      x: PDF_LAYOUT.pageWidth - PDF_LAYOUT.marginX - footerRightWidth,
      y: startY,
      font: fonts.regular,
      size: PDF_FONT_SIZES.micro,
      color: PDF_COLORS.textLight,
    });
  }
}
