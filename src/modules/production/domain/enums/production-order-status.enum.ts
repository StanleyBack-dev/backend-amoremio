export enum ProductionOrderStatus {
  // Being edited: batches / yield can change, nothing has hit stock.
  RASCUNHO = "RASCUNHO",
  // Completed: costs frozen, inputs debited and the finished good credited.
  // Can only move on to ESTORNADA.
  CONCLUIDA = "CONCLUIDA",
  // A completed order undone: its inputs returned to stock and its finished
  // goods taken back out. Frozen costs are kept for the record. Terminal.
  ESTORNADA = "ESTORNADA",
  // Abandoned before completing. Terminal. Only a RASCUNHO can be cancelled.
  CANCELADA = "CANCELADA",
}
