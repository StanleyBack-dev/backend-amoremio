import { HttpStatus } from "@nestjs/common";
import type { InvalidOptionParams } from "./catalog-params.type";

export const profilesErrors = {
  userIdRequiredForCreate: {
    code: "PROFILES_USER_ID_REQUIRED_FOR_CREATE",
    status: HttpStatus.BAD_REQUEST,
    message: "O ID do usuário é obrigatório para criar um perfil.",
  },
  alreadyExistsForUser: {
    code: "PROFILES_ALREADY_EXISTS_FOR_USER",
    status: HttpStatus.BAD_REQUEST,
    message: "Este usuário já possui um perfil cadastrado.",
  },
  searchParamsMissing: {
    code: "PROFILES_SEARCH_PARAMS_MISSING",
    status: HttpStatus.BAD_REQUEST,
    message: "Parâmetros de busca não informados.",
  },
  idProfilesRequired: {
    code: "PROFILES_ID_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe o idProfiles para buscar o perfil.",
  },
  notFound: {
    code: "PROFILES_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Perfil não encontrado.",
  },
  notFoundForUser: {
    code: "PROFILES_NOT_FOUND_FOR_USER",
    status: HttpStatus.NOT_FOUND,
    message: "Perfil não encontrado para este usuário.",
  },
  noUpdateData: {
    code: "PROFILES_NO_UPDATE_DATA",
    status: HttpStatus.BAD_REQUEST,
    message: "Nenhum dado foi fornecido para atualização.",
  },
  atLeastOneFieldRequired: {
    code: "PROFILES_AT_LEAST_ONE_FIELD_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "É necessário fornecer pelo menos um campo para atualizar.",
  },
  invalidOption: {
    code: "PROFILES_INVALID_OPTION",
    status: HttpStatus.BAD_REQUEST,
    message: ({ field, options }: InvalidOptionParams) =>
      `${field} inválido. Opções válidas: ${options.join(", ")}`,
  },
  editForbidden: {
    code: "PROFILES_EDIT_FORBIDDEN",
    status: HttpStatus.FORBIDDEN,
    message: "Você não tem permissão para editar este perfil.",
  },
} as const;
