export enum StockMovementType {
  // Stock in, from a finalized purchase.
  ENTRADA_COMPRA = "ENTRADA_COMPRA",
  // Stock out, from a confirmed sales order.
  SAIDA_VENDA = "SAIDA_VENDA",
  // Stock out, from an input consumed by a completed production order.
  SAIDA_PRODUCAO = "SAIDA_PRODUCAO",
  // Stock in, from a finished good yielded by a completed production order.
  ENTRADA_PRODUCAO = "ENTRADA_PRODUCAO",
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
  StockMovementType.AJUSTE_POSITIVO,
];

export const STOCK_OUTBOUND_TYPES: StockMovementType[] = [
  StockMovementType.SAIDA_VENDA,
  StockMovementType.SAIDA_PRODUCAO,
  StockMovementType.AJUSTE_NEGATIVO,
  StockMovementType.PERDA,
];
