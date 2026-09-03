export enum PurchaseStatus {
  // Being edited: items can be added/changed/removed, nothing has hit stock.
  RASCUNHO = "RASCUNHO",
  // Confirmed: totals frozen, stock credited. Terminal.
  FINALIZADA = "FINALIZADA",
  // Abandoned before finalizing. Terminal. Only a RASCUNHO can be cancelled.
  CANCELADA = "CANCELADA",
}
