import { HttpStatus } from "@nestjs/common";

export const shoppingListErrors = {
  notFound: {
    code: "SHOPPING_LIST_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Lista de compras não encontrada.",
  },
  itemNotFound: {
    code: "SHOPPING_LIST_ITEM_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Item da lista de compras não encontrado.",
  },
  notOpen: {
    code: "SHOPPING_LIST_NOT_OPEN",
    status: HttpStatus.CONFLICT,
    message: "Só é possível alterar uma lista de compras aberta.",
  },
  noItemsToAdd: {
    code: "SHOPPING_LIST_NO_ITEMS_TO_ADD",
    status: HttpStatus.BAD_REQUEST,
    message: "Adicione ao menos um item à lista.",
  },
  emptyList: {
    code: "SHOPPING_LIST_EMPTY",
    status: HttpStatus.CONFLICT,
    message: "Adicione ao menos um item antes de converter em compra.",
  },
  cannotCancelConverted: {
    code: "SHOPPING_LIST_CANNOT_CANCEL_CONVERTED",
    status: HttpStatus.CONFLICT,
    message: "Uma lista já convertida em compra não pode ser cancelada.",
  },
  productNotPurchasable: {
    code: "SHOPPING_LIST_PRODUCT_NOT_PURCHASABLE",
    status: HttpStatus.CONFLICT,
    message:
      "Este produto não pode entrar em uma lista de compras. Apenas insumos e produtos de revenda podem ser comprados.",
  },
  duplicatedItem: {
    code: "SHOPPING_LIST_DUPLICATED_ITEM",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `"${product}" já está nesta lista — ajuste a quantidade da linha existente.`,
  },
} as const;
