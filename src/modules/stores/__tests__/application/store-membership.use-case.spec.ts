import { AppException } from "@/common/exceptions/app-exception";
import { AddStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/add-store-member.use-case";
import { RemoveStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/remove-store-member.use-case";
import { UpdateStoreMemberRoleUseCase } from "@/modules/stores/application/use-cases/membership/update-store-member-role.use-case";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

const allowAuth = {
  assertStorePermission: jest.fn().mockResolvedValue(undefined),
} as never;

describe("AddStoreMemberUseCase", () => {
  function build(
    overrides: {
      targetUser?: unknown;
      existingMembership?: unknown;
    } = {},
  ) {
    const targetUser =
      "targetUser" in overrides
        ? overrides.targetUser
        : { idUsers: "user-2", name: "Bob" };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(targetUser),
    };
    const storeRepository = {
      findById: jest.fn().mockResolvedValue({ idStore: "store-1" }),
      findMembership: jest
        .fn()
        .mockResolvedValue(overrides?.existingMembership ?? null),
      addMember: jest.fn().mockResolvedValue({}),
      listMembers: jest.fn().mockResolvedValue([]),
    };
    return {
      useCase: new AddStoreMemberUseCase(
        userRepository as never,
        storeRepository as never,
        allowAuth,
      ),
      storeRepository,
    };
  }

  it("adds a member when the target user exists and isn't already in the store", async () => {
    const { useCase, storeRepository } = build();

    await useCase.execute("owner-1", {
      idStore: "store-1",
      idUsers: "user-2",
      role: StoreRole.GERENTE,
    });

    expect(storeRepository.addMember).toHaveBeenCalledWith(
      "store-1",
      "user-2",
      StoreRole.GERENTE,
    );
  });

  it("rejects a non-existent target user", async () => {
    const { useCase } = build({ targetUser: null });

    await expect(
      useCase.execute("owner-1", {
        idStore: "store-1",
        idUsers: "ghost",
        role: StoreRole.FUNCIONARIO,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects a user already in the store", async () => {
    const { useCase } = build({
      existingMembership: { idStoreMembership: "m" },
    });

    await expect(
      useCase.execute("owner-1", {
        idStore: "store-1",
        idUsers: "user-2",
        role: StoreRole.FUNCIONARIO,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});

describe("last-owner protection", () => {
  function buildRepo(role: StoreRole, owners: number) {
    return {
      findMembership: jest
        .fn()
        .mockResolvedValue({ idStoreMembership: "m-1", role }),
      countOwners: jest.fn().mockResolvedValue(owners),
      updateMemberRole: jest.fn().mockResolvedValue({}),
      removeMember: jest.fn().mockResolvedValue(undefined),
      listMembers: jest.fn().mockResolvedValue([]),
    };
  }

  it("blocks demoting the last DONO", async () => {
    const repo = buildRepo(StoreRole.DONO, 1);
    const useCase = new UpdateStoreMemberRoleUseCase(repo as never, allowAuth);

    await expect(
      useCase.execute("owner-1", {
        idStore: "store-1",
        idUsers: "owner-1",
        role: StoreRole.GERENTE,
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(repo.updateMemberRole).not.toHaveBeenCalled();
  });

  it("allows demoting a DONO when another owner remains", async () => {
    const repo = buildRepo(StoreRole.DONO, 2);
    const useCase = new UpdateStoreMemberRoleUseCase(repo as never, allowAuth);

    await useCase.execute("owner-1", {
      idStore: "store-1",
      idUsers: "owner-2",
      role: StoreRole.GERENTE,
    });
    expect(repo.updateMemberRole).toHaveBeenCalled();
  });

  it("blocks removing the last DONO", async () => {
    const repo = buildRepo(StoreRole.DONO, 1);
    const useCase = new RemoveStoreMemberUseCase(repo as never, allowAuth);

    await expect(
      useCase.execute("owner-1", { idStore: "store-1", idUsers: "owner-1" }),
    ).rejects.toBeInstanceOf(AppException);
    expect(repo.removeMember).not.toHaveBeenCalled();
  });
});
