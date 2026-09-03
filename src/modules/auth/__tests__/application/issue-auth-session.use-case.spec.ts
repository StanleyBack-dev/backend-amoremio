import { IssueAuthSessionService } from "@/modules/auth/application/use-cases/issue-auth-session.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";

function buildDeps() {
  const authTokensUseCase = {
    signAccessToken: jest.fn().mockReturnValue("access-token"),
    signRefreshToken: jest.fn().mockReturnValue("refresh-token"),
    getRefreshTokenMaxAgeMs: jest.fn().mockReturnValue(1000 * 60 * 60),
  };

  const createSessionUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const authCredentialsUseCase = {
    registerSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
  };

  return { authTokensUseCase, createSessionUseCase, authCredentialsUseCase };
}

describe("IssueAuthSessionService", () => {
  it("signs tokens, opens a session and registers a successful login", async () => {
    const deps = buildDeps();
    const service = new IssueAuthSessionService(
      deps.authTokensUseCase as never,
      deps.createSessionUseCase as never,
      deps.authCredentialsUseCase as never,
    );

    const result = await service.execute(authCredentialMock, {
      ipAddress: "127.0.0.1",
      userAgent: "jest",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.response).toEqual({
      authenticated: true,
      mustChangePassword: authCredentialMock.mustChangePassword,
      onboardingTourCompleted: authCredentialMock.onboardingTourCompleted,
      termsAccepted: false,
      isTermsReacceptance: false,
      user: {
        idUsers: authCredentialMock.user.idUsers,
        name: authCredentialMock.user.name,
        email: authCredentialMock.user.email,
        username: authCredentialMock.username,
        group: authCredentialMock.user.group,
        status: authCredentialMock.user.status,
        urlAvatar: authCredentialMock.user.urlAvatar,
      },
    });

    expect(deps.createSessionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: authCredentialMock.idUsers,
        refreshToken: "refresh-token",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        sessionActive: true,
      }),
    );
    expect(
      deps.authCredentialsUseCase.registerSuccessfulLogin,
    ).toHaveBeenCalledWith(authCredentialMock);
  });
});
