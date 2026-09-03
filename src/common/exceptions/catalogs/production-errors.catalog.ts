import { HttpStatus } from "@nestjs/common";

export const productionErrors = {
  recipeNotFound: {
    code: "PRODUCTION_RECIPE_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Receita não encontrada.",
  },
  recipeItemNotFound: {
    code: "PRODUCTION_RECIPE_ITEM_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Ingrediente da receita não encontrado.",
  },
  duplicatedRecipe: {
    code: "PRODUCTION_DUPLICATED_RECIPE",
    status: HttpStatus.CONFLICT,
    message: "Este produto já possui uma ficha técnica.",
  },
  outputNotFinishedGood: {
    code: "PRODUCTION_OUTPUT_NOT_FINISHED_GOOD",
    status: HttpStatus.CONFLICT,
    message:
      "Só um produto final ou intermediário pode ser o resultado de uma receita.",
  },
  inputNotInsumo: {
    code: "PRODUCTION_INPUT_NOT_INSUMO",
    status: HttpStatus.CONFLICT,
    message:
      "Só insumos e produtos intermediários podem ser ingredientes de uma receita.",
  },
  recipeCycle: {
    code: "PRODUCTION_RECIPE_CYCLE",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `"${product}" não pode ser ingrediente — ele já depende (direta ou indiretamente) desta receita.`,
  },
  unitMismatch: {
    code: "PRODUCTION_UNIT_MISMATCH",
    status: HttpStatus.BAD_REQUEST,
    message: ({ product, unit }: { product: string; unit: string }) =>
      `A unidade do ingrediente "${product}" deve ser "${unit}" (a mesma do estoque).`,
  },
  invalidYield: {
    code: "PRODUCTION_INVALID_YIELD",
    status: HttpStatus.BAD_REQUEST,
    message: "O rendimento da receita deve ser maior que zero.",
  },
  invalidQuantity: {
    code: "PRODUCTION_INVALID_QUANTITY",
    status: HttpStatus.BAD_REQUEST,
    message: "A quantidade deve ser maior que zero.",
  },
  noItemsToAdd: {
    code: "PRODUCTION_NO_ITEMS_TO_ADD",
    status: HttpStatus.BAD_REQUEST,
    message: "Adicione ao menos um ingrediente à lista.",
  },
  duplicatedRecipeItem: {
    code: "PRODUCTION_DUPLICATED_RECIPE_ITEM",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `"${product}" já está na ficha técnica — ajuste a quantidade da linha existente.`,
  },
  orderNotFound: {
    code: "PRODUCTION_ORDER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Ordem de produção não encontrada.",
  },
  orderNotDraft: {
    code: "PRODUCTION_ORDER_NOT_DRAFT",
    status: HttpStatus.CONFLICT,
    message: "Só é possível alterar uma ordem de produção em rascunho.",
  },
  emptyOrder: {
    code: "PRODUCTION_ORDER_EMPTY",
    status: HttpStatus.CONFLICT,
    message:
      "A receita desta ordem não tem ingredientes — adicione ingredientes à receita antes de produzir.",
  },
  alreadyConcluded: {
    code: "PRODUCTION_ORDER_ALREADY_CONCLUDED",
    status: HttpStatus.CONFLICT,
    message: "Esta ordem de produção já foi concluída.",
  },
  cannotCancelConcluded: {
    code: "PRODUCTION_ORDER_CANNOT_CANCEL_CONCLUDED",
    status: HttpStatus.CONFLICT,
    message:
      "Uma ordem de produção concluída não pode ser cancelada — ajuste o estoque manualmente se necessário.",
  },
  recipeInactive: {
    code: "PRODUCTION_RECIPE_INACTIVE",
    status: HttpStatus.CONFLICT,
    message: "Esta receita está inativa e não pode ser produzida.",
  },
  insufficientInput: {
    code: "PRODUCTION_INSUFFICIENT_INPUT",
    status: HttpStatus.CONFLICT,
    message: ({ product }: { product: string }) =>
      `Estoque de insumo insuficiente para "${product}".`,
  },
} as const;
