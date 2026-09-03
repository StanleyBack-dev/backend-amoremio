// How the purchase discount is expressed. VALOR = a flat amount in reais;
// PERCENTUAL = a percentage of the items subtotal (the effective amount is
// recomputed whenever the subtotal changes).
export enum PurchaseDiscountMode {
  VALOR = "VALOR",
  PERCENTUAL = "PERCENTUAL",
}
