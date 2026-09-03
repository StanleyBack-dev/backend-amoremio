import { PDFDocument } from "pdf-lib";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import { RenderTabularReportTemplateService } from "../../presentation/templates/financial-table/render-tabular-report-template.service";

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

describe("RenderTabularReportTemplateService", () => {
  const service = new RenderTabularReportTemplateService();

  it("renders a single-page PDF for a normal payload", async () => {
    const buffer = await service.render(buildPayload());
    expect(buffer.length).toBeGreaterThan(0);

    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBe(1);
  });

  it("renders the empty state without a table when there are no rows", async () => {
    const buffer = await service.render(buildPayload({ rows: [], totals: [] }));

    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBe(1);
  });

  it("paginates across multiple pages when rows overflow the page height", async () => {
    const manyRows = Array.from({ length: 80 }, (_, index) => [
      `Item de teste número ${index + 1} com uma descrição um pouco mais longa`,
      "10/08/2026",
      "Aberto",
      "R$ 100,00",
    ]);

    const buffer = await service.render(
      buildPayload({
        rows: manyRows,
        totals: [{ label: "Total", value: "R$ 8.000,00" }],
      }),
    );

    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThan(1);
  });
});
