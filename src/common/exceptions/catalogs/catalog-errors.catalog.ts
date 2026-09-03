import { HttpStatus } from "@nestjs/common";

export const catalogErrors = {
  productNotFound: {
    code: "CATALOG_PRODUCT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Produto não encontrado.",
  },
  duplicatedName: {
    code: "CATALOG_PRODUCT_DUPLICATED_NAME",
    status: HttpStatus.CONFLICT,
    message: "Já existe um produto com este nome nesta loja.",
  },
  duplicatedNameForBrand: {
    code: "CATALOG_PRODUCT_DUPLICATED_NAME_BRAND",
    status: HttpStatus.CONFLICT,
    message: "Já existe um produto com este nome e marca nesta loja.",
  },
  duplicatedSku: {
    code: "CATALOG_PRODUCT_DUPLICATED_SKU",
    status: HttpStatus.CONFLICT,
    message: "Já existe um produto com este código (SKU) nesta loja.",
  },
  skuGenerationFailed: {
    code: "CATALOG_PRODUCT_SKU_GENERATION_FAILED",
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Não foi possível gerar um código (SKU) para o produto.",
  },
} as const;
