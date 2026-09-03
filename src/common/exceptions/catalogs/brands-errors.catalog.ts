import { HttpStatus } from "@nestjs/common";

export const brandsErrors = {
  notFound: {
    code: "BRANDS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Marca não encontrada.",
  },
  duplicatedName: {
    code: "BRANDS_DUPLICATED_NAME",
    status: HttpStatus.CONFLICT,
    message: "Já existe uma marca com este nome nesta loja.",
  },
} as const;
