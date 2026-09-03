import { HttpStatus } from "@nestjs/common";

export const storesErrors = {
  notFound: {
    code: "STORES_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Loja não encontrada.",
  },
  invalidCnpj: {
    code: "STORES_INVALID_CNPJ",
    status: HttpStatus.BAD_REQUEST,
    message: "CNPJ inválido — deve conter 14 dígitos.",
  },
  notAMember: {
    code: "STORES_NOT_A_MEMBER",
    status: HttpStatus.FORBIDDEN,
    message: "Você não faz parte desta loja.",
  },
  missingStorePermission: {
    code: "STORES_MISSING_STORE_PERMISSION",
    status: HttpStatus.FORBIDDEN,
    message: ({ role, permission }: { role: string; permission: string }) =>
      `O papel ${role} não permite a ação ${permission} nesta loja.`,
  },
  memberNotFound: {
    code: "STORES_MEMBER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Membro não encontrado nesta loja.",
  },
  memberAlreadyExists: {
    code: "STORES_MEMBER_ALREADY_EXISTS",
    status: HttpStatus.CONFLICT,
    message: "Este usuário já faz parte da loja.",
  },
  targetUserNotFound: {
    code: "STORES_TARGET_USER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Usuário informado não existe.",
  },
  lastOwner: {
    code: "STORES_LAST_OWNER",
    status: HttpStatus.CONFLICT,
    message:
      "A loja precisa de pelo menos um DONO — promova outro membro antes de alterar este.",
  },
} as const;
