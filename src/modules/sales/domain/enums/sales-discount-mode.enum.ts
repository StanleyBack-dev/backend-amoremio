// How the sales-order discount is expressed. VALOR = a flat amount in reais;
// PERCENTUAL = a percentage of the items subtotal (the effective amount is
// recomputed whenever the subtotal changes).
export enum SalesDiscountMode {
  VALOR = "VALOR",
  PERCENTUAL = "PERCENTUAL",
}
