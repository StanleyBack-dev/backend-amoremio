import { HttpStatus } from "@nestjs/common";

export const salesErrors = {
  notFound: {
    code: "SALES_ORDER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Ordem de venda não encontrada.",
  },
  itemNotFound: {
    code: "SALES_ITEM_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Item da venda não encontrado.",
  },
  notOpen: {
    code: "SALES_ORDER_NOT_OPEN",
    status: HttpStatus.CONFLICT,
    message: "Só é possível alterar uma ordem de venda aberta.",
  },
  emptyOrder: {
    code: "SALES_ORDER_EMPTY",
    status: HttpStatus.CONFLICT,
    message: "Adicione ao menos um item antes de confirmar a venda.",
  },
  cannotCancelConfirmed: {
    code: "SALES_CANNOT_CANCEL_CONFIRMED",
    status: HttpStatus.CONFLICT,
    message:
      "Uma venda confirmada não pode ser cancelada — ajuste o estoque manualmente se necessário.",
  },
  insufficientStock: {
    code: "SALES_INSUFFICIENT_STOCK",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `Estoque insuficiente para "${product}".`,
  },
  invalidItemQuantity: {
    code: "SALES_INVALID_ITEM_QUANTITY",
    status: HttpStatus.BAD_REQUEST,
    message: "A quantidade vendida deve ser maior que zero.",
  },
  invalidItemPrice: {
    code: "SALES_INVALID_ITEM_PRICE",
    status: HttpStatus.BAD_REQUEST,
    message: "O valor unitário não pode ser negativo.",
  },
  discountTooLarge: {
    code: "SALES_DISCOUNT_TOO_LARGE",
    status: HttpStatus.BAD_REQUEST,
    message: "O desconto não pode ser maior que o subtotal.",
  },
  productNotSellable: {
    code: "SALES_PRODUCT_NOT_SELLABLE",
    status: HttpStatus.CONFLICT,
    message:
      "Este produto não pode ser vendido. Apenas produtos finais e de revenda entram em vendas.",
  },
} as const;
