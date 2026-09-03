import {
  STORE_ROLE_PERMISSIONS,
  roleHasPermission,
} from "@/modules/stores/domain/constants/store-role-permissions.constant";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

describe("STORE_ROLE_PERMISSIONS", () => {
  it("gives DONO every permission", () => {
    expect(STORE_ROLE_PERMISSIONS[StoreRole.DONO]).toEqual(
      Object.values(StorePermission),
    );
  });

  it("lets GERENTE do everything except managing the store and its members", () => {
    expect(
      roleHasPermission(StoreRole.GERENTE, StorePermission.FINALIZE_PURCHASE),
    ).toBe(true);
    expect(
      roleHasPermission(StoreRole.GERENTE, StorePermission.VIEW_DASHBOARD),
    ).toBe(true);
    expect(
      roleHasPermission(StoreRole.GERENTE, StorePermission.MANAGE_STORE),
    ).toBe(false);
    expect(
      roleHasPermission(
        StoreRole.GERENTE,
        StorePermission.MANAGE_STORE_MEMBERS,
      ),
    ).toBe(false);
  });

  it("limits FUNCIONARIO to recording purchases/sales and reading stock", () => {
    expect(
      roleHasPermission(StoreRole.FUNCIONARIO, StorePermission.REGISTER_SALE),
    ).toBe(true);
    expect(
      roleHasPermission(
        StoreRole.FUNCIONARIO,
        StorePermission.REGISTER_PURCHASE,
      ),
    ).toBe(true);
    expect(
      roleHasPermission(
        StoreRole.FUNCIONARIO,
        StorePermission.FINALIZE_PURCHASE,
      ),
    ).toBe(false);
    expect(
      roleHasPermission(
        StoreRole.FUNCIONARIO,
        StorePermission.ADJUST_INVENTORY,
      ),
    ).toBe(false);
    expect(
      roleHasPermission(StoreRole.FUNCIONARIO, StorePermission.VIEW_DASHBOARD),
    ).toBe(false);
    expect(
      roleHasPermission(StoreRole.FUNCIONARIO, StorePermission.MANAGE_PRODUCTS),
    ).toBe(false);
  });

  it("lets FUNCIONARIO register production but not manage recipes or complete it", () => {
    expect(
      roleHasPermission(
        StoreRole.FUNCIONARIO,
        StorePermission.REGISTER_PRODUCTION,
      ),
    ).toBe(true);
    expect(
      roleHasPermission(StoreRole.FUNCIONARIO, StorePermission.MANAGE_RECIPES),
    ).toBe(false);
    expect(
      roleHasPermission(
        StoreRole.FUNCIONARIO,
        StorePermission.COMPLETE_PRODUCTION,
      ),
    ).toBe(false);
  });

  it("lets GERENTE manage recipes and complete production", () => {
    expect(
      roleHasPermission(StoreRole.GERENTE, StorePermission.MANAGE_RECIPES),
    ).toBe(true);
    expect(
      roleHasPermission(StoreRole.GERENTE, StorePermission.COMPLETE_PRODUCTION),
    ).toBe(true);
  });
});
