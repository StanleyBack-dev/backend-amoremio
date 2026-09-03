import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { ResetPasswordWithRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/reset-password-with-recovery.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";
import { userMock } from "@/modules/users/__mocks__/user.mock";

const activeRecoveryMock = {
  idAuthVerificationCodes: "code-1",
  idUsers: authCredentialMock.idUsers,
};

function buildService(overrides?: {
  findByResetToken?: jest.Mock;
  findByUserIdOrFail?: jest.Mock;
}) {
  const passwordRecoveryCodesUseCase = {
    findByResetToken:
      overrides?.findByResetToken ??
      jest.fn().mockResolvedValue(activeRecoveryMock),
    consume: jest.fn().mockResolvedValue(undefined),
  };
  const authCredentialsUseCase = {
    findByUserIdOrFail:
      overrides?.findByUserIdOrFail ??
      jest.fn().mockResolvedValue(authCredentialMock),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };
  const passwordHasherUseCase = {
    hashPassword: jest.fn().mockResolvedValue("new-hash"),
  };
  const passwordChangedEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const service = new ResetPasswordWithRecoveryService(
    passwordRecoveryCodesUseCase as never,
    authCredentialsUseCase as never,
    passwordHasherUseCase as never,
    passwordChangedEmailUseCase as never,
  );

  return {
    service,
    passwordRecoveryCodesUseCase,
    authCredentialsUseCase,
    passwordHasherUseCase,
    passwordChangedEmailUseCase,
  };
}

describe("ResetPasswordWithRecoveryService", () => {
  it("rejects an unknown, expired or already-consumed recovery token", async () => {
    const { service } = buildService({
      findByResetToken: jest.fn().mockResolvedValue(null),
    });

    const promise = service.execute("bad-token", "NewPassword123!");

    await expect(promise).rejects.toBeInstanceOf(AppException);
    await expect(promise).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: { code: APP_ERRORS.auth.passwordRecoveryNotAllowed.code },
    });
  });

  it("rejects when the account tied to the token has since gone inactive", async () => {
    const { service } = buildService({
      findByUserIdOrFail: jest.fn().mockResolvedValue({
        ...authCredentialMock,
        user: { ...userMock, status: false },
      }),
    });

    await expect(
      service.execute("recovery-token", "NewPassword123!"),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      response: { code: APP_ERRORS.auth.inactiveUser.code },
    });
  });

  it("hashes the new password, persists it and consumes the recovery code", async () => {
    const {
      service,
      authCredentialsUseCase,
      passwordRecoveryCodesUseCase,
      passwordHasherUseCase,
      passwordChangedEmailUseCase,
    } = buildService();

    await service.execute("recovery-token", "NewPassword123!");

    expect(passwordHasherUseCase.hashPassword).toHaveBeenCalledWith(
      "NewPassword123!",
    );
    expect(authCredentialsUseCase.updatePassword).toHaveBeenCalledWith(
      authCredentialMock,
      "new-hash",
    );
    expect(passwordRecoveryCodesUseCase.consume).toHaveBeenCalledWith(
      activeRecoveryMock,
    );
    expect(passwordChangedEmailUseCase.send).toHaveBeenCalledWith({
      to: authCredentialMock.user.email,
      name: authCredentialMock.user.name,
    });
  });
});
