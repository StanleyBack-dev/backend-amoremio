// What role a product plays in the shop.
export enum ProductKind {
  // Raw material / packaging: bought and consumed in production, never sold
  // directly. Shows up when registering a purchase, not a sale.
  INSUMO = "INSUMO",
  // Finished good the customer buys. Shows up when registering a sale, not a
  // purchase. Its stock comes from the production context (recipes + production
  // orders); a sale of a finished good moves stock like any other.
  PRODUTO_FINAL = "PRODUTO_FINAL",
  // Bought and resold without transformation. Shows up in both, and a sale
  // does move stock.
  REVENDA = "REVENDA",
  // Semi-finished good (e.g. a base dough): produced from its own recipe and
  // consumed as an ingredient in other recipes. Never bought or sold
  // directly; holds stock like anything else.
  INTERMEDIARIO = "INTERMEDIARIO",
}

export const PURCHASABLE_KINDS: ProductKind[] = [
  ProductKind.INSUMO,
  ProductKind.REVENDA,
];

export const SELLABLE_KINDS: ProductKind[] = [
  ProductKind.PRODUTO_FINAL,
  ProductKind.REVENDA,
];

// Kinds whose stock is reduced when a sale is confirmed. Finished goods are
// included now that production feeds their stock — a finished good must be
// produced before it can be sold.
export const STOCK_MOVING_ON_SALE_KINDS: ProductKind[] = [
  ProductKind.REVENDA,
  ProductKind.PRODUTO_FINAL,
];

// Kinds consumed as inputs in a recipe / production order. Intermediates
// count — that is what makes sub-recipes work.
export const PRODUCIBLE_INPUT_KINDS: ProductKind[] = [
  ProductKind.INSUMO,
  ProductKind.INTERMEDIARIO,
];

// Kinds that a recipe can yield as its output.
export const PRODUCIBLE_OUTPUT_KINDS: ProductKind[] = [
  ProductKind.PRODUTO_FINAL,
  ProductKind.INTERMEDIARIO,
];
