import { HttpStatus } from "@nestjs/common";

export const inventoryErrors = {
  invalidMovement: {
    code: "INVENTORY_INVALID_MOVEMENT",
    status: HttpStatus.BAD_REQUEST,
    message: "Movimentação de estoque inválida.",
  },
  insufficientStock: {
    code: "INVENTORY_INSUFFICIENT_STOCK",
    status: HttpStatus.CONFLICT,
    message: "Estoque insuficiente para a operação.",
  },
} as const;
