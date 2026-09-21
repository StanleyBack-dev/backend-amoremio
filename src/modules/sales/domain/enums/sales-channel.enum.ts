// Where a sale came from. PESSOAL is what the store owners buy for themselves,
// FAMILIA what relatives buy and TRABALHO what workplaces buy
// (all still counted in the totals). Delivery marketplaces usually charge a commission
// on the order total; the counter / direct channels do not.
export enum SalesChannel {
  BALCAO = "BALCAO",
  IFOOD = "IFOOD",
  RAPPI = "RAPPI",
  FOOD_99 = "FOOD_99",
  UBER_EATS = "UBER_EATS",
  AIQFOME = "AIQFOME",
  WHATSAPP = "WHATSAPP",
  TELEFONE = "TELEFONE",
  FACULDADE = "FACULDADE",
  PESSOAL = "PESSOAL",
  FAMILIA = "FAMILIA",
  TRABALHO = "TRABALHO",
  OUTRO = "OUTRO",
}
