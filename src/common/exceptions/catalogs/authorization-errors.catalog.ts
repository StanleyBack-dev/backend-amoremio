import { HttpStatus } from "@nestjs/common";
import type { PermissionParams } from "./catalog-params.type";

export const authorizationErrors = {
  authenticatedUserNotFound: {
    code: "AUTHZ_AUTHENTICATED_USER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Usuário autenticado não encontrado.",
  },
  missingPermission: {
    code: "AUTHZ_MISSING_PERMISSION",
    status: HttpStatus.FORBIDDEN,
    message: ({ group, permission }: PermissionParams) =>
      `O grupo ${group} não possui a permissão ${permission}.`,
  },
  onlyAdminMasterCanManagePermissions: {
    code: "AUTHZ_ONLY_ADMIN_MASTER_CAN_MANAGE_PERMISSIONS",
    status: HttpStatus.FORBIDDEN,
    message:
      "Somente ADMIN_MASTER pode gerenciar permissões de páginas dos usuários.",
  },
  missingPageAccess: {
    code: "AUTHZ_MISSING_PAGE_ACCESS",
    status: HttpStatus.FORBIDDEN,
    message: ({ page }: { page: string }) =>
      `Usuário não possui acesso à página ${page}.`,
  },
} as const;
