export enum ShoppingListStatus {
  // Being curated: items can be added/changed/removed.
  ABERTA = "ABERTA",
  // Converted into a purchase draft. Terminal.
  CONVERTIDA = "CONVERTIDA",
  // Abandoned before converting. Terminal. Only an ABERTA list can be cancelled.
  CANCELADA = "CANCELADA",
}
