export enum ProductionOrderStatus {
  // Being edited: batches / yield can change, nothing has hit stock.
  RASCUNHO = "RASCUNHO",
  // Completed: costs frozen, inputs debited and the finished good credited.
  // Terminal.
  CONCLUIDA = "CONCLUIDA",
  // Abandoned before completing. Terminal. Only a RASCUNHO can be cancelled.
  CANCELADA = "CANCELADA",
}
