// How a product is counted / bought as whole physical items ("3 sacos", "2
// caixas"). It is only a label — the amount that actually moves through
// stock, recipes and sales is the measure unit (`unit`) times `packSize`.
export enum PackagingUnit {
  UNIDADE = "UNIDADE",
  PACOTE = "PACOTE",
  CAIXA = "CAIXA",
  FARDO = "FARDO",
  SACO = "SACO",
  GARRAFA = "GARRAFA",
  LATA = "LATA",
  POTE = "POTE",
  DUZIA = "DUZIA",
  BANDEJA = "BANDEJA",
}
