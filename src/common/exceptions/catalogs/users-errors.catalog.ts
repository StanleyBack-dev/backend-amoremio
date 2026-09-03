import { HttpStatus } from "@nestjs/common";

export const usersErrors = {
  emailAlreadyExists: {
    code: "USERS_EMAIL_ALREADY_EXISTS",
    status: HttpStatus.CONFLICT,
    message: "Este e-mail já está cadastrado.",
  },
  notFound: {
    code: "USERS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Usuário não encontrado.",
  },
  invalidLookupInput: {
    code: "USERS_INVALID_LOOKUP_INPUT",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe um ID ou um e-mail para buscar o usuário.",
  },
  invalidUpdateInput: {
    code: "USERS_INVALID_UPDATE_INPUT",
    status: HttpStatus.BAD_REQUEST,
    message: "Nenhum campo válido foi informado para atualização.",
  },
  invalidEmail: {
    code: "USERS_INVALID_EMAIL",
    status: HttpStatus.BAD_REQUEST,
    message: "Email inválido.",
  },
  inactiveUser: {
    code: "USERS_INACTIVE_USER",
    status: HttpStatus.FORBIDDEN,
    message: "Usuário inativo.",
  },
} as const;
