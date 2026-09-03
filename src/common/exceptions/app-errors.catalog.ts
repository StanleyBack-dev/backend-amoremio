import type { AppErrorDefinition } from "@/common/exceptions/app-error-definition.type";
import { authErrors } from "@/common/exceptions/catalogs/auth-errors.catalog";
import { authorizationErrors } from "@/common/exceptions/catalogs/authorization-errors.catalog";
import { brandsErrors } from "@/common/exceptions/catalogs/brands-errors.catalog";
import { catalogErrors } from "@/common/exceptions/catalogs/catalog-errors.catalog";
import { internalErrors } from "@/common/exceptions/catalogs/internal-errors.catalog";
import { inventoryErrors } from "@/common/exceptions/catalogs/inventory-errors.catalog";
import { mailsErrors } from "@/common/exceptions/catalogs/mails-errors.catalog";
import { pdfErrors } from "@/common/exceptions/catalogs/pdf-errors.catalog";
import { productionErrors } from "@/common/exceptions/catalogs/production-errors.catalog";
import { profilesErrors } from "@/common/exceptions/catalogs/profiles-errors.catalog";
import { purchasingErrors } from "@/common/exceptions/catalogs/purchasing-errors.catalog";
import { rateLimitErrors } from "@/common/exceptions/catalogs/rate-limit-errors.catalog";
import { salesErrors } from "@/common/exceptions/catalogs/sales-errors.catalog";
import { sharedErrors } from "@/common/exceptions/catalogs/shared-errors.catalog";
import { storesErrors } from "@/common/exceptions/catalogs/stores-errors.catalog";
import { suppliersErrors } from "@/common/exceptions/catalogs/suppliers-errors.catalog";
import { usersErrors } from "@/common/exceptions/catalogs/users-errors.catalog";
import { validationErrors } from "@/common/exceptions/catalogs/validation-errors.catalog";

export const APP_ERRORS = {
  auth: authErrors,
  authorization: authorizationErrors,
  brands: brandsErrors,
  catalog: catalogErrors,
  inventory: inventoryErrors,
  production: productionErrors,
  purchasing: purchasingErrors,
  sales: salesErrors,
  shared: sharedErrors,
  stores: storesErrors,
  suppliers: suppliersErrors,
  users: usersErrors,
  profiles: profilesErrors,
  mails: mailsErrors,
  pdf: pdfErrors,
  validation: validationErrors,
  rateLimit: rateLimitErrors,
  internal: internalErrors,
} as const satisfies Record<string, Record<string, AppErrorDefinition<never>>>;
