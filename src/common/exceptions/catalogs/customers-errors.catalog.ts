import { HttpStatus } from "@nestjs/common";

export const customersErrors = {
  notFound: {
    code: "CUSTOMERS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Cliente não encontrado.",
  },
  duplicatedPhone: {
    code: "CUSTOMERS_DUPLICATED_PHONE",
    status: HttpStatus.CONFLICT,
    message: "Já existe um cliente com este telefone nesta loja.",
  },
} as const;
