import { SetMetadata } from "@nestjs/common";
import type { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

export const AUTH_PERMISSIONS_KEY = "authPermissions";
export const RequirePermissions = (...permissions: AuthPermission[]) =>
  SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
