import { HttpStatus } from "@nestjs/common";
import type {
  EntityNameParams,
  FieldNameParams,
  FormatValueParams,
} from "./catalog-params.type";

export const validationErrors = {
  invalidDate: {
    code: "VALIDATION_INVALID_DATE",
    status: HttpStatus.BAD_REQUEST,
    message: "Data inválida.",
  },
  futureDateNotAllowed: {
    code: "VALIDATION_FUTURE_DATE_NOT_ALLOWED",
    status: HttpStatus.BAD_REQUEST,
    message: "Data não pode ser no futuro.",
  },
  customerWeightOutOfRange: {
    code: "VALIDATION_CUSTOMER_WEIGHT_OUT_OF_RANGE",
    status: HttpStatus.BAD_REQUEST,
    message: "Peso fora do intervalo permitido.",
  },
  documentMustContain11Digits: {
    code: "VALIDATION_DOCUMENT_MUST_CONTAIN_11_DIGITS",
    status: HttpStatus.BAD_REQUEST,
    message: "Documento deve conter 11 dígitos.",
  },
  invalidFormat: {
    code: "VALIDATION_INVALID_FORMAT",
    status: HttpStatus.BAD_REQUEST,
    message: ({ value }: FormatValueParams) => `Formato inválido: ${value}.`,
  },
  missingField: {
    code: "VALIDATION_MISSING_FIELD",
    status: HttpStatus.BAD_REQUEST,
    message: ({ field }: FieldNameParams) => `O campo ${field} é obrigatório.`,
  },
  entityNotFound: {
    code: "VALIDATION_ENTITY_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: ({ entity }: EntityNameParams) => `${entity} não encontrado.`,
  },
} as const;
