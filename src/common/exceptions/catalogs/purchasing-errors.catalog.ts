import { HttpStatus } from "@nestjs/common";

export const purchasingErrors = {
  notFound: {
    code: "PURCHASING_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Compra não encontrada.",
  },
  itemNotFound: {
    code: "PURCHASING_ITEM_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Item da compra não encontrado.",
  },
  notDraft: {
    code: "PURCHASING_NOT_DRAFT",
    status: HttpStatus.CONFLICT,
    message: "Só é possível alterar uma compra em rascunho.",
  },
  financialsLocked: {
    code: "PURCHASING_FINANCIALS_LOCKED",
    status: HttpStatus.CONFLICT,
    message:
      "Frete, desconto, itens e data não podem ser alterados após finalizar a compra.",
  },
  emptyPurchase: {
    code: "PURCHASING_EMPTY",
    status: HttpStatus.CONFLICT,
    message: "Adicione ao menos um item antes de finalizar a compra.",
  },
  alreadyFinalized: {
    code: "PURCHASING_ALREADY_FINALIZED",
    status: HttpStatus.CONFLICT,
    message: "Esta compra já foi finalizada.",
  },
  cannotCancelFinalized: {
    code: "PURCHASING_CANNOT_CANCEL_FINALIZED",
    status: HttpStatus.CONFLICT,
    message:
      "Uma compra finalizada não pode ser cancelada — ajuste o estoque manualmente se necessário.",
  },
  invalidItemQuantity: {
    code: "PURCHASING_INVALID_ITEM_QUANTITY",
    status: HttpStatus.BAD_REQUEST,
    message: "A quantidade comprada deve ser maior que zero.",
  },
  invalidConversionFactor: {
    code: "PURCHASING_INVALID_CONVERSION_FACTOR",
    status: HttpStatus.BAD_REQUEST,
    message: "O fator de conversão deve ser maior que zero.",
  },
  invalidItemPrice: {
    code: "PURCHASING_INVALID_ITEM_PRICE",
    status: HttpStatus.BAD_REQUEST,
    message: "O valor unitário não pode ser negativo.",
  },
  discountTooLarge: {
    code: "PURCHASING_DISCOUNT_TOO_LARGE",
    status: HttpStatus.BAD_REQUEST,
    message: "O desconto não pode ser maior que o total da compra.",
  },
  productNotPurchasable: {
    code: "PURCHASING_PRODUCT_NOT_PURCHASABLE",
    status: HttpStatus.CONFLICT,
    message:
      "Este produto não pode ser comprado. Apenas insumos e produtos de revenda entram em compras.",
  },
  duplicatedItem: {
    code: "PURCHASING_DUPLICATED_ITEM",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `"${product}" já está nesta compra — ajuste a quantidade da linha existente.`,
  },
} as const;
