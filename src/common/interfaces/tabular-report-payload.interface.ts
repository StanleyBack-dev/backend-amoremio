export type TabularReportColumnAlign = "left" | "center" | "right";

export interface TabularReportColumn {
  label: string;
  /** Relative weight used to distribute the available width across columns. */
  weight: number;
  align?: TabularReportColumnAlign;
}

export interface TabularReportTotal {
  label: string;
  value: string;
}

/**
 * Generic tabular payload shared by the PDF and Excel renderers, so an
 * export use-case builds this shape once and hands it to either format.
 */
export interface TabularReportPayload {
  documentTitle: string;
  documentSubtitle?: string;
  generatedAtLabel: string;
  userLabel: string;
  columns: TabularReportColumn[];
  rows: string[][];
  totals: TabularReportTotal[];
  emptyStateLabel: string;
  referenceCode: string;
}
