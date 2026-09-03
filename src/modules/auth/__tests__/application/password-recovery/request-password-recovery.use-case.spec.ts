import { RequestPasswordRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/request-password-recovery.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";
import { userMock } from "@/modules/users/__mocks__/user.mock";

function buildService(overrides?: {
  findUser?: jest.Mock;
  findCredential?: jest.Mock;
}) {
  const userRepository = {
    findOne: overrides?.findUser ?? jest.fn().mockResolvedValue(userMock),
  };
  const authCredentialsUseCase = {
    findByUserId:
      overrides?.findCredential ??
      jest.fn().mockResolvedValue(authCredentialMock),
  };
  const passwordRecoveryCodesUseCase = {
    normalizeEmail: jest.fn((email: string) => email.trim().toLowerCase()),
    issuePasswordRecoveryCode: jest.fn().mockResolvedValue({
      code: "12345",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }),
  };
  const passwordRecoveryEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const service = new RequestPasswordRecoveryService(
    userRepository as never,
    authCredentialsUseCase as never,
    passwordRecoveryCodesUseCase as never,
    passwordRecoveryEmailUseCase as never,
  );

  return {
    service,
    userRepository,
    authCredentialsUseCase,
    passwordRecoveryCodesUseCase,
    passwordRecoveryEmailUseCase,
  };
}

describe("RequestPasswordRecoveryService", () => {
  // Password recovery must never reveal whether an email is registered —
  // an attacker probing arbitrary addresses should see the same silent
  // response either way, so a non-existent user resolves without error and
  // without ever touching the code-issuing/email-sending path.
  it("silently no-ops for an email that has no matching user", async () => {
    const {
      service,
      passwordRecoveryCodesUseCase,
      passwordRecoveryEmailUseCase,
    } = buildService({ findUser: jest.fn().mockResolvedValue(null) });

    await expect(
      service.execute("nobody@example.com"),
    ).resolves.toBeUndefined();
    expect(
      passwordRecoveryCodesUseCase.issuePasswordRecoveryCode,
    ).not.toHaveBeenCalled();
    expect(passwordRecoveryEmailUseCase.send).not.toHaveBeenCalled();
  });

  it("silently no-ops for an inactive user", async () => {
    const { service, passwordRecoveryEmailUseCase } = buildService({
      findUser: jest.fn().mockResolvedValue({ ...userMock, status: false }),
    });

    await expect(service.execute(userMock.email)).resolves.toBeUndefined();
    expect(passwordRecoveryEmailUseCase.send).not.toHaveBeenCalled();
  });

  it("silently no-ops for a user with no auth credential provisioned", async () => {
    const { service, passwordRecoveryEmailUseCase } = buildService({
      findCredential: jest.fn().mockResolvedValue(null),
    });

    await expect(service.execute(userMock.email)).resolves.toBeUndefined();
    expect(passwordRecoveryEmailUseCase.send).not.toHaveBeenCalled();
  });

  it("issues a code and sends the recovery email for a valid active user", async () => {
    const {
      service,
      passwordRecoveryCodesUseCase,
      passwordRecoveryEmailUseCase,
    } = buildService();

    await service.execute(userMock.email);

    expect(
      passwordRecoveryCodesUseCase.issuePasswordRecoveryCode,
    ).toHaveBeenCalledWith(userMock);
    expect(passwordRecoveryEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userMock.email,
        code: "12345",
        username: authCredentialMock.username,
      }),
    );
  });

  it("swallows an email-sending failure instead of throwing", async () => {
    const { service, passwordRecoveryEmailUseCase } = buildService();
    passwordRecoveryEmailUseCase.send.mockRejectedValue(new Error("SMTP down"));

    await expect(service.execute(userMock.email)).resolves.toBeUndefined();
  });
});
