import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { AuthResolver } from "@/modules/auth/presentation/graphql/resolvers/auth.resolver";
import { LoginService } from "@/modules/auth/application/use-cases/login.use-case";
import { RefreshAuthSessionService } from "@/modules/auth/application/use-cases/refresh-auth-session.use-case";
import { LogoutService } from "@/modules/auth/application/use-cases/logout.use-case";
import { ChangePasswordService } from "@/modules/auth/application/use-cases/change-password.use-case";
import { CompleteOnboardingTourService } from "@/modules/auth/application/use-cases/complete-onboarding-tour.use-case";
import { RequestPasswordRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/request-password-recovery.use-case";
import { VerifyPasswordRecoveryCodeService } from "@/modules/auth/application/use-cases/password-recovery/verify-password-recovery-code.use-case";
import { ResetPasswordWithRecoveryService } from "@/modules/auth/application/use-cases/password-recovery/reset-password-with-recovery.use-case";
import { AuthCookieService } from "@/modules/auth/application/use-cases/auth-cookie.use-case";
import { authCredentialMock } from "../../__mocks__/auth-credential.mock";

describe("AuthResolver", () => {
  let resolver: AuthResolver;
  let loginUseCase: jest.Mocked<LoginService>;
  let changePasswordUseCase: jest.Mocked<ChangePasswordService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: LoginService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              accessToken: "access-token",
              refreshToken: "refresh-token",
              response: {
                authenticated: true,
                mustChangePassword: true,
                user: {
                  idUsers: authCredentialMock.idUsers,
                  name: authCredentialMock.user.name,
                  email: authCredentialMock.user.email,
                  username: authCredentialMock.username,
                  group: authCredentialMock.user.group,
                  status: authCredentialMock.user.status,
                  urlAvatar: authCredentialMock.user.urlAvatar,
                },
              },
            }),
          },
        },
        {
          provide: RefreshAuthSessionService,
          useValue: { execute: jest.fn() },
        },
        {
          provide: LogoutService,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ChangePasswordService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CompleteOnboardingTourService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: RequestPasswordRecoveryService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: VerifyPasswordRecoveryCodeService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ResetPasswordWithRecoveryService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: AuthCookieService,
          useValue: {
            setAuthCookies: jest.fn(),
            clearAuthCookies: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    loginUseCase = module.get(LoginService);
    changePasswordUseCase = module.get(ChangePasswordService);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });

  it("should delegate login", async () => {
    const result = await resolver.login(
      { username: "mock.user", password: "TempPassword123" },
      {
        req: {
          headers: { "user-agent": "jest" },
          socket: { remoteAddress: "127.0.0.1" },
        } as never,
        res: {} as never,
      },
    );

    expect(result.authenticated).toBe(true);
    expect(loginUseCase.execute).toHaveBeenCalled();
  });

  it("should delegate password change", async () => {
    const result = await resolver.changeMyPassword(
      {
        idUsers: authCredentialMock.idUsers,
        username: authCredentialMock.username,
        group: authCredentialMock.user.group,
      },
      {
        currentPassword: "TempPassword123",
        newPassword: "NewPassword456",
      },
    );

    expect(result.success).toBe(true);
    expect(changePasswordUseCase.execute).toHaveBeenCalledWith(
      authCredentialMock.idUsers,
      {
        currentPassword: "TempPassword123",
        newPassword: "NewPassword456",
      },
    );
  });
});
