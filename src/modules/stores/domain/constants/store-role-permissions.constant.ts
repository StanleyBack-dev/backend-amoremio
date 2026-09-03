import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

const ALL_PERMISSIONS: StorePermission[] = Object.values(StorePermission);

// FUNCIONARIO: runs day-to-day work (records purchases, sales and production
// orders, reads stock) but cannot finalize purchases, complete production,
// adjust stock, see the financials, or touch the catalog / recipes / members.
const FUNCIONARIO_PERMISSIONS: StorePermission[] = [
  StorePermission.VIEW_STORE,
  StorePermission.VIEW_INVENTORY,
  StorePermission.REGISTER_PURCHASE,
  StorePermission.REGISTER_SALE,
  StorePermission.REGISTER_PRODUCTION,
];

// GERENTE: everything operational + financial + catalog, except managing
// the store's identity and its members (DONO only).
const GERENTE_PERMISSIONS: StorePermission[] = ALL_PERMISSIONS.filter(
  (permission) =>
    permission !== StorePermission.MANAGE_STORE &&
    permission !== StorePermission.MANAGE_STORE_MEMBERS,
);

export const STORE_ROLE_PERMISSIONS: Record<StoreRole, StorePermission[]> = {
  [StoreRole.DONO]: ALL_PERMISSIONS,
  [StoreRole.GERENTE]: GERENTE_PERMISSIONS,
  [StoreRole.FUNCIONARIO]: FUNCIONARIO_PERMISSIONS,
};

export function roleHasPermission(
  role: StoreRole,
  permission: StorePermission,
): boolean {
  return STORE_ROLE_PERMISSIONS[role].includes(permission);
}
