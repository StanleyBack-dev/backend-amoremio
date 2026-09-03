import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CreateSessionUseCase } from "@/modules/sessions/application/use-cases/create/create-session.use-case";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create/create-user.use-case";
import { GetUsersUseCase } from "@/modules/users/application/use-cases/get/get-users.use-case";
import { UserExistsValidator } from "@/modules/users/application/validators/user-exists.validator";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { UserPageAccessEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/user-page-access.entity";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { AuthTokensService } from "@/modules/auth/application/use-cases/auth-tokens.use-case";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { ChangePasswordService } from "@/modules/auth/application/use-cases/change-password.use-case";
import { IssueAuthSessionService } from "@/modules/auth/application/use-cases/issue-auth-session.use-case";
import { LoginService } from "@/modules/auth/application/use-cases/login.use-case";
import { PasswordHasherService } from "@/modules/auth/application/use-cases/password-hasher.use-case";
import { UserOnboardingEmailUseCase } from "@/modules/mails/application/use-cases/user-onboarding-email.use-case";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { UserPageAccessUseCase } from "@/modules/users/application/use-cases/permissions/user-page-access.use-case";

describe("Auth onboarding flow", () => {
  let createUserUseCase: CreateUserUseCase;
  let loginUseCase: LoginService;
  let changePasswordUseCase: ChangePasswordService;
  let passwordHasherUseCase: PasswordHasherService;
  let userOnboardingEmailUseCase: {
    send: jest.Mock<Promise<void>, [unknown]>;
  };

  const sessions: Array<Record<string, unknown>> = [];
  const users: UserEntity[] = [
    {
      idUsers: "admin-master-id",
      name: "Admin Master",
      email: "admin.master@example.com",
      status: true,
      group: UserGroup.ADMIN_MASTER,
      urlAvatar: undefined,
      inactivatedAt: undefined,
      ipAddress: undefined,
      userAgent: undefined,
      createdAt: new Date("2024-04-12T00:00:00Z"),
      updatedAt: new Date("2024-04-12T00:00:00Z"),
    },
  ];
  const credentials: AuthCredentialEntity[] = [];

  const userRepository = {
    findOne: jest.fn(async ({ where }: { where: Partial<UserEntity> }) => {
      return (
        users.find((user) => {
          if (where.idUsers) return user.idUsers === where.idUsers;
          if (where.email) return user.email === where.email;
          if (where.group) return user.group === where.group;
          return false;
        }) ?? null
      );
    }),
    create: jest.fn((value: Partial<UserEntity>) => value),
    save: jest.fn(async (value: Partial<UserEntity>) => {
      const existing = users.find((user) => user.idUsers === value.idUsers);
      if (existing) {
        Object.assign(existing, value, { updatedAt: new Date() });
        return existing;
      }

      const entity = {
        idUsers: `user-${users.length + 1}`,
        name: value.name!,
        email: value.email!,
        status: value.status ?? true,
        group: value.group ?? UserGroup.USER,
        urlAvatar: value.urlAvatar,
        inactivatedAt: value.inactivatedAt,
        ipAddress: value.ipAddress,
        userAgent: value.userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserEntity;
      users.push(entity);
      return entity;
    }),
    find: jest.fn(async () => users),
    count: jest.fn(async () => 0),
  };

  const authCredentialRepository = {
    findOne: jest.fn(
      async ({ where }: { where: Partial<AuthCredentialEntity> }) => {
        const credential =
          credentials.find((item) => {
            if (where.username) return item.username === where.username;
            if (where.idUsers) return item.idUsers === where.idUsers;
            return false;
          }) ?? null;

        if (!credential) {
          return null;
        }

        return {
          ...credential,
          user: users.find((user) => user.idUsers === credential.idUsers)!,
        };
      },
    ),
    create: jest.fn((value: Partial<AuthCredentialEntity>) => value),
    save: jest.fn(async (value: Partial<AuthCredentialEntity>) => {
      const existingIndex = credentials.findIndex(
        (credential) => credential.idUsers === value.idUsers,
      );

      const entity = {
        idAuthCredentials:
          value.idAuthCredentials ??
          credentials[existingIndex]?.idAuthCredentials ??
          `credential-${credentials.length + 1}`,
        idUsers: value.idUsers!,
        user: users.find((user) => user.idUsers === value.idUsers)!,
        username: value.username!,
        passwordHash: value.passwordHash!,
        mustChangePassword: value.mustChangePassword ?? true,
        temporaryPasswordCreatedAt:
          value.temporaryPasswordCreatedAt ??
          credentials[existingIndex]?.temporaryPasswordCreatedAt,
        passwordChangedAt:
          value.passwordChangedAt ??
          credentials[existingIndex]?.passwordChangedAt,
        lastLoginAt:
          value.lastLoginAt ?? credentials[existingIndex]?.lastLoginAt,
        failedLoginAttempts:
          value.failedLoginAttempts ??
          credentials[existingIndex]?.failedLoginAttempts ??
          0,
        lockUntil: value.lockUntil,
        createdAt: credentials[existingIndex]?.createdAt ?? new Date(),
        updatedAt: new Date(),
      } as AuthCredentialEntity;

      if (existingIndex >= 0) {
        credentials[existingIndex] = entity;
      } else {
        credentials.push(entity);
      }

      return entity;
    }),
    update: jest.fn(
      async (
        criteria: Partial<AuthCredentialEntity>,
        partial: Partial<AuthCredentialEntity>,
      ) => {
        const existing = credentials.find((credential) => {
          if (criteria.idAuthCredentials) {
            return credential.idAuthCredentials === criteria.idAuthCredentials;
          }

          if (criteria.idUsers) {
            return credential.idUsers === criteria.idUsers;
          }

          if (criteria.username) {
            return credential.username === criteria.username;
          }

          return false;
        });

        if (existing) {
          Object.assign(existing, partial, { updatedAt: new Date() });
          return { affected: 1 };
        }

        return { affected: 0 };
      },
    ),
  };

  const dataSource = {
    transaction: jest.fn(
      async (
        callback: (manager: {
          getRepository: (entity: unknown) => unknown;
        }) => unknown,
      ) =>
        callback({
          getRepository: (entity: unknown) => {
            if (entity === UserEntity) {
              return userRepository;
            }

            return authCredentialRepository;
          },
        }),
    ),
  };

  beforeEach(async () => {
    sessions.length = 0;
    users.splice(1);
    credentials.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        GetUsersUseCase,
        UserExistsValidator,
        AuthorizationService,
        AuthCredentialsService,
        PasswordHasherService,
        AuthTokensService,
        IssueAuthSessionService,
        LoginService,
        ChangePasswordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_SECRET:
                  "integration-access-secret-royal-copeiras-2026-strong-value",
                JWT_REFRESH_SECRET:
                  "integration-refresh-secret-royal-copeiras-2026-strong-value",
                JWT_ACCESS_EXPIRES_IN: "15m",
                JWT_REFRESH_EXPIRES_IN: "30d",
              };

              return config[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(AuthCredentialEntity),
          useValue: authCredentialRepository,
        },
        {
          provide: getRepositoryToken(UserPageAccessEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: CreateSessionUseCase,
          useValue: {
            execute: jest.fn(async (session: Record<string, unknown>) => {
              sessions.push(session);
              return session;
            }),
          },
        },
        {
          provide: UserOnboardingEmailUseCase,
          useValue: (userOnboardingEmailUseCase = {
            send: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: PasswordChangedEmailUseCase,
          useValue: { send: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: UserPageAccessUseCase,
          useValue: {
            setDuringUserCreation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    createUserUseCase = module.get(CreateUserUseCase);
    loginUseCase = module.get(LoginService);
    changePasswordUseCase = module.get(ChangePasswordService);
    passwordHasherUseCase = module.get(PasswordHasherService);
  });

  it("should create a user, login with temporary password and force password rotation", async () => {
    const createResult = await createUserUseCase.execute(
      "admin-master-id",
      {
        name: "Operador Backoffice",
        email: "operador@example.com",
        username: "operador.backoffice",
        group: UserGroup.USER,
      },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(createResult.mustChangePassword).toBe(true);
    expect(createResult).not.toHaveProperty("temporaryPassword");
    expect(userOnboardingEmailUseCase.send).toHaveBeenCalledTimes(1);

    const onboardingPayload = userOnboardingEmailUseCase.send.mock
      .calls[0]?.[0] as {
      temporaryPassword: string;
      username: string;
    };
    expect(onboardingPayload?.temporaryPassword).toBeTruthy();

    const firstLogin = await loginUseCase.execute(
      {
        username: createResult.username,
        password: onboardingPayload.temporaryPassword,
      },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(firstLogin.response.authenticated).toBe(true);
    expect(firstLogin.response.mustChangePassword).toBe(true);
    expect(sessions).toHaveLength(1);

    await changePasswordUseCase.execute(createResult.idUsers, {
      currentPassword: onboardingPayload.temporaryPassword,
      newPassword: "NovaSenhaSuperSegura123!",
    });

    const updatedCredential = credentials.find(
      (credential) => credential.idUsers === createResult.idUsers,
    );
    expect(updatedCredential?.mustChangePassword).toBe(false);
    expect(
      await passwordHasherUseCase.verifyPassword(
        "NovaSenhaSuperSegura123!",
        updatedCredential!.passwordHash,
      ),
    ).toBe(true);

    const secondLogin = await loginUseCase.execute(
      {
        username: createResult.username,
        password: "NovaSenhaSuperSegura123!",
      },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(secondLogin.response.mustChangePassword).toBe(false);
    expect(sessions).toHaveLength(2);
  });
});
