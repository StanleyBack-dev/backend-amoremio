import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ChangePasswordService } from "@/modules/auth/application/use-cases/change-password.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

function buildService(overrides?: { verifyPassword?: jest.Mock }) {
  const authCredentialsUseCase = {
    findByUserIdOrFail: jest.fn().mockResolvedValue(authCredentialMock),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };
  const authorizationUseCase = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };
  const passwordHasherUseCase = {
    verifyPassword:
      overrides?.verifyPassword ?? jest.fn().mockResolvedValue(true),
    hashPassword: jest.fn().mockResolvedValue("new-hash"),
  };
  const passwordChangedEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ChangePasswordService(
    authCredentialsUseCase as never,
    authorizationUseCase as never,
    passwordHasherUseCase as never,
    passwordChangedEmailUseCase as never,
  );

  return {
    service,
    authCredentialsUseCase,
    authorizationUseCase,
    passwordHasherUseCase,
    passwordChangedEmailUseCase,
  };
}

describe("ChangePasswordService", () => {
  it("asserts the CHANGE_OWN_PASSWORD permission before doing anything else", async () => {
    const { service, authorizationUseCase } = buildService();

    await service.execute(authCredentialMock.idUsers, {
      currentPassword: "current-password",
      newPassword: "brand-new-password",
    });

    expect(authorizationUseCase.assertPermissionForUserId).toHaveBeenCalledWith(
      authCredentialMock.idUsers,
      AuthPermission.CHANGE_OWN_PASSWORD,
    );
  });

  it("rejects when the new password is the same as the current one", async () => {
    const { service } = buildService();

    const error = await captureError(() =>
      service.execute(authCredentialMock.idUsers, {
        currentPassword: "same-password",
        newPassword: "same-password",
      }),
    );

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: { code: APP_ERRORS.auth.newPasswordMustDiffer.code },
    });
  });

  it("rejects when the current password does not match", async () => {
    const { service } = buildService({
      verifyPassword: jest.fn().mockResolvedValue(false),
    });

    const error = await captureError(() =>
      service.execute(authCredentialMock.idUsers, {
        currentPassword: "wrong-current-password",
        newPassword: "brand-new-password",
      }),
    );

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      response: { code: APP_ERRORS.auth.invalidCurrentPassword.code },
    });
  });

  it("hashes and persists the new password on success", async () => {
    const {
      service,
      passwordHasherUseCase,
      authCredentialsUseCase,
      passwordChangedEmailUseCase,
    } = buildService();

    await service.execute(authCredentialMock.idUsers, {
      currentPassword: "current-password",
      newPassword: "brand-new-password",
    });

    expect(passwordHasherUseCase.hashPassword).toHaveBeenCalledWith(
      "brand-new-password",
    );
    expect(authCredentialsUseCase.updatePassword).toHaveBeenCalledWith(
      authCredentialMock,
      "new-hash",
    );
    expect(passwordChangedEmailUseCase.send).toHaveBeenCalledWith({
      to: authCredentialMock.user.email,
      name: authCredentialMock.user.name,
    });
  });
});
