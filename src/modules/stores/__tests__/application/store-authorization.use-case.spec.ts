import { AppException } from "@/common/exceptions/app-exception";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

function build(overrides?: {
  userGroup?: UserGroup;
  membershipRole?: StoreRole | null;
}) {
  const userRepository = {
    findOne: jest.fn().mockResolvedValue(
      overrides?.userGroup
        ? { idUsers: "user-1", group: overrides.userGroup }
        : { idUsers: "user-1", group: UserGroup.USER },
    ),
  };
  const storeRepository = {
    findMembership: jest.fn().mockResolvedValue(
      overrides?.membershipRole
        ? { idStoreMembership: "m-1", role: overrides.membershipRole }
        : null,
    ),
  };

  const service = new StoreAuthorizationService(
    userRepository as never,
    storeRepository as never,
  );

  return { service, userRepository, storeRepository };
}

describe("StoreAuthorizationService", () => {
  it("lets an ADMIN_MASTER through without a membership", async () => {
    const { service, storeRepository } = build({
      userGroup: UserGroup.ADMIN_MASTER,
    });

    await expect(
      service.assertStorePermission(
        "user-1",
        "store-1",
        StorePermission.MANAGE_STORE,
      ),
    ).resolves.toBeUndefined();
    expect(storeRepository.findMembership).not.toHaveBeenCalled();
  });

  it("rejects a user with no membership", async () => {
    const { service } = build({ membershipRole: null });

    await expect(
      service.assertStorePermission(
        "user-1",
        "store-1",
        StorePermission.VIEW_STORE,
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("allows an action the role permits", async () => {
    const { service } = build({ membershipRole: StoreRole.FUNCIONARIO });

    await expect(
      service.assertStorePermission(
        "user-1",
        "store-1",
        StorePermission.REGISTER_SALE,
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects an action the role does not permit", async () => {
    const { service } = build({ membershipRole: StoreRole.FUNCIONARIO });

    await expect(
      service.assertStorePermission(
        "user-1",
        "store-1",
        StorePermission.FINALIZE_PURCHASE,
      ),
    ).rejects.toBeInstanceOf(AppException);
  });
});
