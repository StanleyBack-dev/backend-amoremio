export enum StockMovementType {
  // Stock in, from a finalized purchase.
  ENTRADA_COMPRA = "ENTRADA_COMPRA",
  // Stock out, from a confirmed sales order.
  SAIDA_VENDA = "SAIDA_VENDA",
  // Stock out, from an input consumed by a completed production order.
  SAIDA_PRODUCAO = "SAIDA_PRODUCAO",
  // Stock in, from a finished good yielded by a completed production order.
  ENTRADA_PRODUCAO = "ENTRADA_PRODUCAO",
  // Stock in, returning an input a reversed production order had consumed.
  ESTORNO_SAIDA_PRODUCAO = "ESTORNO_SAIDA_PRODUCAO",
  // Stock out, removing a finished good a reversed production order had
  // credited. Leaves at the cost it came in at (see
  // STOCK_COST_REVERSAL_TYPES), not at the current average.
  ESTORNO_ENTRADA_PRODUCAO = "ESTORNO_ENTRADA_PRODUCAO",
  // Manual count correction upwards.
  AJUSTE_POSITIVO = "AJUSTE_POSITIVO",
  // Manual count correction downwards.
  AJUSTE_NEGATIVO = "AJUSTE_NEGATIVO",
  // Stock written off (spoilage, breakage, theft).
  PERDA = "PERDA",
}

export const STOCK_INBOUND_TYPES: StockMovementType[] = [
  StockMovementType.ENTRADA_COMPRA,
  StockMovementType.ENTRADA_PRODUCAO,
  StockMovementType.ESTORNO_SAIDA_PRODUCAO,
  StockMovementType.AJUSTE_POSITIVO,
];

export const STOCK_OUTBOUND_TYPES: StockMovementType[] = [
  StockMovementType.SAIDA_VENDA,
  StockMovementType.SAIDA_PRODUCAO,
  StockMovementType.ESTORNO_ENTRADA_PRODUCAO,
  StockMovementType.AJUSTE_NEGATIVO,
  StockMovementType.PERDA,
];

// Outbound movements that undo an earlier inbound one. Unlike a regular exit
// (which leaves at the current average and never moves it), these take out
// exactly the value that came in, so the average cost goes back to what it
// would have been without the undone entry.
export const STOCK_COST_REVERSAL_TYPES: StockMovementType[] = [
  StockMovementType.ESTORNO_ENTRADA_PRODUCAO,
];
