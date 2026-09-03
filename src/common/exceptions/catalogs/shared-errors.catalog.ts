import { HttpStatus } from "@nestjs/common";

export const sharedErrors = {
  invalidMoney: {
    code: "SHARED_INVALID_MONEY",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor monetário inválido.",
  },
  invalidQuantity: {
    code: "SHARED_INVALID_QUANTITY",
    status: HttpStatus.BAD_REQUEST,
    message: "Quantidade inválida.",
  },
  negativeQuantity: {
    code: "SHARED_NEGATIVE_QUANTITY",
    status: HttpStatus.CONFLICT,
    message: "A operação deixaria a quantidade negativa.",
  },
} as const;
