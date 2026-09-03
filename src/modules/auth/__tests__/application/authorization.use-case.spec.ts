import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { userMock } from "@/modules/users/__mocks__/user.mock";

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("AuthorizationService", () => {
  describe("assertPermissionForUserId", () => {
    it("throws when the user does not exist", async () => {
      const userRepository = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new AuthorizationService(userRepository as never);

      const error = await captureError(() =>
        service.assertPermissionForUserId(
          "missing-user",
          AuthPermission.MANAGE_OWN_DEBTS,
        ),
      );

      expect(error).toBeInstanceOf(AppException);
      expect(error).toMatchObject({
        status: HttpStatus.NOT_FOUND,
        response: {
          code: APP_ERRORS.authorization.authenticatedUserNotFound.code,
        },
      });
    });

    it("throws when the user's group lacks the permission", async () => {
      const userRepository = {
        findOne: jest
          .fn()
          .mockResolvedValue({ ...userMock, group: UserGroup.USER }),
      };
      const service = new AuthorizationService(userRepository as never);

      const error = await captureError(() =>
        service.assertPermissionForUserId(
          userMock.idUsers,
          AuthPermission.MANAGE_USERS,
        ),
      );

      expect(error).toBeInstanceOf(AppException);
      expect(error).toMatchObject({
        status: HttpStatus.FORBIDDEN,
        response: { code: APP_ERRORS.authorization.missingPermission.code },
      });
    });

    it("resolves when the user's group has the permission", async () => {
      const userRepository = {
        findOne: jest
          .fn()
          .mockResolvedValue({ ...userMock, group: UserGroup.USER }),
      };
      const service = new AuthorizationService(userRepository as never);

      await expect(
        service.assertPermissionForUserId(
          userMock.idUsers,
          AuthPermission.MANAGE_OWN_DEBTS,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("assertPermissionsForGroup", () => {
    it("throws naming the first missing permission out of several", () => {
      const service = new AuthorizationService({} as never);

      expect(() =>
        service.assertPermissionsForGroup(UserGroup.USER, [
          AuthPermission.MANAGE_OWN_DEBTS,
          AuthPermission.MANAGE_USERS,
        ]),
      ).toThrow(AppException);
    });

    it("does not throw when the group has every permission requested", () => {
      const service = new AuthorizationService({} as never);

      expect(() =>
        service.assertPermissionsForGroup(UserGroup.ADMIN_MASTER, [
          AuthPermission.MANAGE_OWN_DEBTS,
          AuthPermission.MANAGE_USERS,
        ]),
      ).not.toThrow();
    });
  });

  describe("assertPageAccessForUserId", () => {
    it("throws when the user does not exist", async () => {
      const userRepository = { findOne: jest.fn().mockResolvedValue(null) };
      const service = new AuthorizationService(
        userRepository as never,
        { findOne: jest.fn() } as never,
      );

      const error = await captureError(() =>
        service.assertPageAccessForUserId(
          "missing-user",
          PageAccessKey.DASHBOARD,
        ),
      );

      expect(error).toBeInstanceOf(AppException);
      expect(error).toMatchObject({
        response: {
          code: APP_ERRORS.authorization.authenticatedUserNotFound.code,
        },
      });
    });

    it("falls back to the group's default page access when there is no override", async () => {
      const userRepository = {
        findOne: jest
          .fn()
          .mockResolvedValue({ ...userMock, group: UserGroup.USER }),
      };
      const userPageAccessRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = new AuthorizationService(
        userRepository as never,
        userPageAccessRepository as never,
      );

      await expect(
        service.assertPageAccessForUserId(
          userMock.idUsers,
          PageAccessKey.DASHBOARD,
        ),
      ).resolves.toBeUndefined();

      await expect(
        service.assertPageAccessForUserId(
          userMock.idUsers,
          PageAccessKey.ADMIN,
        ),
      ).rejects.toBeInstanceOf(AppException);
    });

    it("an explicit denied override wins even if the group default allows the page", async () => {
      const userRepository = {
        findOne: jest
          .fn()
          .mockResolvedValue({ ...userMock, group: UserGroup.USER }),
      };
      const userPageAccessRepository = {
        findOne: jest.fn().mockResolvedValue({
          pageKey: PageAccessKey.DASHBOARD,
          allowed: false,
        }),
      };
      const service = new AuthorizationService(
        userRepository as never,
        userPageAccessRepository as never,
      );

      const error = await captureError(() =>
        service.assertPageAccessForUserId(
          userMock.idUsers,
          PageAccessKey.DASHBOARD,
        ),
      );

      expect(error).toBeInstanceOf(AppException);
      expect(error).toMatchObject({
        response: { code: APP_ERRORS.authorization.missingPageAccess.code },
      });
    });

    it("an explicit allowed override wins even if the group default denies the page", async () => {
      const userRepository = {
        findOne: jest
          .fn()
          .mockResolvedValue({ ...userMock, group: UserGroup.USER }),
      };
      const userPageAccessRepository = {
        findOne: jest.fn().mockResolvedValue({
          pageKey: PageAccessKey.ADMIN,
          allowed: true,
        }),
      };
      const service = new AuthorizationService(
        userRepository as never,
        userPageAccessRepository as never,
      );

      await expect(
        service.assertPageAccessForUserId(
          userMock.idUsers,
          PageAccessKey.ADMIN,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
