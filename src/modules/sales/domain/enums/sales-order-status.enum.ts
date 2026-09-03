export enum SalesOrderStatus {
  // Being assembled: items can change, nothing has left stock.
  ABERTA = "ABERTA",
  // Confirmed: totals frozen, stock debited. Terminal.
  CONFIRMADA = "CONFIRMADA",
  // Abandoned before confirming. Terminal. Only an ABERTA order can be cancelled.
  CANCELADA = "CANCELADA",
}
