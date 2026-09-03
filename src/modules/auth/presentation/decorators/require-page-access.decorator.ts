import { SetMetadata } from "@nestjs/common";
import type { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

export const PAGE_ACCESS_KEY = "pageAccessKey";
export const RequirePageAccess = (page: PageAccessKey) =>
  SetMetadata(PAGE_ACCESS_KEY, page);
