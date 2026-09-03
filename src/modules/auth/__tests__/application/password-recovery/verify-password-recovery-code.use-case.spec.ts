import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { VerifyPasswordRecoveryCodeService } from "@/modules/auth/application/use-cases/password-recovery/verify-password-recovery-code.use-case";

const activeCodeMock = {
  idAuthVerificationCodes: "code-1",
  codeHash: "hashed-code",
};

function buildService(overrides?: {
  findLatestValidCodeForEmail?: jest.Mock;
  verifyPassword?: jest.Mock;
}) {
  const passwordRecoveryCodesUseCase = {
    findLatestValidCodeForEmail:
      overrides?.findLatestValidCodeForEmail ??
      jest.fn().mockResolvedValue(activeCodeMock),
    registerInvalidAttempt: jest.fn().mockResolvedValue(undefined),
    markVerified: jest.fn().mockResolvedValue({
      recoveryToken: "recovery-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }),
  };
  const passwordHasherUseCase = {
    verifyPassword:
      overrides?.verifyPassword ?? jest.fn().mockResolvedValue(true),
  };

  const service = new VerifyPasswordRecoveryCodeService(
    passwordRecoveryCodesUseCase as never,
    passwordHasherUseCase as never,
  );

  return { service, passwordRecoveryCodesUseCase, passwordHasherUseCase };
}

describe("VerifyPasswordRecoveryCodeService", () => {
  it("rejects when there is no active code for the email", async () => {
    const { service } = buildService({
      findLatestValidCodeForEmail: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.execute("someone@example.com", "12345"),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: {
        code: APP_ERRORS.auth.passwordRecoveryCodeInvalidOrExpired.code,
      },
    });
  });

  it("registers an invalid attempt and rejects on a wrong code", async () => {
    const { service, passwordRecoveryCodesUseCase } = buildService({
      verifyPassword: jest.fn().mockResolvedValue(false),
    });

    await expect(
      service.execute("someone@example.com", "wrong-code"),
    ).rejects.toBeInstanceOf(AppException);

    expect(
      passwordRecoveryCodesUseCase.registerInvalidAttempt,
    ).toHaveBeenCalledWith(activeCodeMock);
    expect(passwordRecoveryCodesUseCase.markVerified).not.toHaveBeenCalled();
  });

  it("marks the code verified and returns a recovery token on a correct code", async () => {
    const { service, passwordRecoveryCodesUseCase } = buildService();

    const result = await service.execute("someone@example.com", "12345");

    expect(passwordRecoveryCodesUseCase.markVerified).toHaveBeenCalledWith(
      activeCodeMock,
    );
    expect(result.recoveryToken).toBe("recovery-token");
  });
});
