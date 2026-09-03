import { HttpStatus } from "@nestjs/common";

export const suppliersErrors = {
  notFound: {
    code: "SUPPLIERS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Fornecedor não encontrado.",
  },
  duplicatedName: {
    code: "SUPPLIERS_DUPLICATED_NAME",
    status: HttpStatus.CONFLICT,
    message: "Já existe um fornecedor com este nome nesta loja.",
  },
} as const;
