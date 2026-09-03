import ExcelJS from "exceljs";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import { RenderTabularWorkbookService } from "../../application/use-cases/render-tabular-workbook.use-case";

function buildPayload(
  overrides: Partial<TabularReportPayload> = {},
): TabularReportPayload {
  return {
    documentTitle: "Relatório de Dívidas",
    documentSubtitle: "Período: 01/01/2026 a 31/01/2026",
    generatedAtLabel: "Gerado em 10 de agosto de 2026 às 14:32",
    userLabel: "Stanley Rodrigues",
    columns: [
      { label: "Descrição", weight: 3, align: "left" },
      { label: "Vencimento", weight: 1, align: "center" },
      { label: "Status", weight: 1, align: "center" },
      { label: "Valor", weight: 1, align: "right" },
    ],
    rows: [
      ["Cartão Nubank - parcela 3/12", "10/08/2026", "Aberto", "R$ 250,00"],
      ["Financiamento do carro", "15/08/2026", "Pago", "R$ 890,50"],
    ],
    totals: [{ label: "Total", value: "R$ 1.140,50" }],
    emptyStateLabel: "Nenhum registro encontrado para os filtros selecionados.",
    referenceCode: "EXP-DEBTS-0001",
    ...overrides,
  };
}

describe("RenderTabularWorkbookService", () => {
  const service = new RenderTabularWorkbookService();

  it("renders a workbook with the expected rows for a normal payload", async () => {
    const buffer = await service.render(buildPayload());
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];

    expect(sheet.name).toBe("Relatório de Dívidas");
    const values = sheet
      .getRows(1, sheet.rowCount)
      ?.map((row) => row.getCell(1).text);
    expect(values).toContain("Cartão Nubank - parcela 3/12");
    expect(values).toContain("Total");
  });

  it("renders the empty state without throwing when there are no rows", async () => {
    const buffer = await service.render(buildPayload({ rows: [], totals: [] }));

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    const values = sheet
      .getRows(1, sheet.rowCount)
      ?.map((row) => row.getCell(1).text);

    expect(values).toContain(
      "Nenhum registro encontrado para os filtros selecionados.",
    );
  });

  it("truncates and sanitizes sheet names over 31 characters", async () => {
    const buffer = await service.render(
      buildPayload({
        documentTitle: "Relatório de Comparativos por Categoria [2026]",
      }),
    );

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    expect(workbook.worksheets[0].name.length).toBeLessThanOrEqual(31);
    expect(workbook.worksheets[0].name).not.toMatch(/[[\]]/);
  });
});
