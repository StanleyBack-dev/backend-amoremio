import { ForbiddenException, HttpStatus } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AppException } from "../../../../common/exceptions/app-exception";
import { APP_ERRORS } from "../../../../common/exceptions/app-errors.catalog";
import { UserGroup } from "../../domain/enums/user-group.enum";
import { AuthorizationService } from "../../../auth/application/use-cases/authorization.use-case";
import { PasswordHasherService } from "../../../auth/application/use-cases/password-hasher.use-case";
import { UserOnboardingEmailUseCase } from "../../../mails/application/use-cases/user-onboarding-email.use-case";
import { UserExistsValidator } from "../../application/validators/user-exists.validator";
import { CreateUserUseCase } from "../../application/use-cases/create/create-user.use-case";
import { UserPageAccessUseCase } from "../../application/use-cases/permissions/user-page-access.use-case";
import { UserEntity } from "../../infrastructure/persistence/typeorm/entities/user.entity";

describe("CreateUserUseCase", () => {
  let service: CreateUserUseCase;
  let userRepository: { findOne: jest.Mock; count: jest.Mock };
  let userExistsValidator: jest.Mocked<UserExistsValidator>;
  let authorizationService: jest.Mocked<AuthorizationService>;
  let passwordHasherService: jest.Mocked<PasswordHasherService>;
  let userPageAccessUseCase: jest.Mocked<UserPageAccessUseCase>;
  let userOnboardingEmailService: {
    send: jest.Mock<Promise<void>, [unknown]>;
  };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn().mockResolvedValue({
        idUsers: "admin-id",
        name: "Admin User",
        email: "admin@example.com",
        group: UserGroup.ADMIN,
        status: true,
      }),
      count: jest.fn().mockResolvedValue(0),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const savedUser = {
          idUsers: "new-user-id",
          name: "Novo Usuario",
          email: "novo.usuario@example.com",
          group: UserGroup.USER,
          urlAvatar: undefined,
          status: true,
          createdAt: new Date("2024-04-12T00:00:00Z"),
        };

        const manager = {
          getRepository: jest.fn((entity) => {
            if (entity === UserEntity) {
              return {
                create: jest.fn((value) => value),
                save: jest.fn().mockResolvedValue(savedUser),
              };
            }

            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn((value) => value),
              save: jest.fn().mockResolvedValue(undefined),
            };
          }),
        };

        return callback(manager as never);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: UserExistsValidator,
          useValue: {
            ensureUserDoesNotExistByEmail: jest
              .fn()
              .mockResolvedValue(undefined),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordHasherService,
          useValue: {
            generateTemporaryPassword: jest.fn().mockReturnValue("TempPass123"),
            hashPassword: jest.fn().mockResolvedValue("hashed-temp-password"),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: UserOnboardingEmailUseCase,
          useValue: (userOnboardingEmailService = {
            send: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: UserPageAccessUseCase,
          useValue: {
            setDuringUserCreation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CreateUserUseCase>(CreateUserUseCase);
    userExistsValidator = module.get(UserExistsValidator);
    authorizationService = module.get(AuthorizationService);
    passwordHasherService = module.get(PasswordHasherService);
    userPageAccessUseCase = module.get(UserPageAccessUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a user and send temporary password by email", async () => {
    const result = await service.execute(
      "admin-id",
      {
        name: "Novo Usuario",
        email: "novo.usuario@example.com",
        username: "novo.usuario",
        group: UserGroup.USER,
      },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(result.username).toBe("novo.usuario");
    expect(result).not.toHaveProperty("temporaryPassword");
    expect(passwordHasherService.hashPassword).toHaveBeenCalledWith(
      "TempPass123",
    );
    expect(userOnboardingEmailService.send).toHaveBeenCalledWith({
      to: "novo.usuario@example.com",
      name: "Novo Usuario",
      username: "novo.usuario",
      temporaryPassword: "TempPass123",
    });
    expect(userPageAccessUseCase.setDuringUserCreation).toHaveBeenCalled();
    expect(
      userExistsValidator.ensureUserDoesNotExistByEmail,
    ).toHaveBeenCalledWith("novo.usuario@example.com");
  });

  it("should reject creation by non-admin user", async () => {
    authorizationService.assertPermissionForUserId.mockRejectedValueOnce(
      new ForbiddenException("Sem permissão."),
    );

    await expect(
      service.execute("common-user-id", {
        name: "Novo Usuario",
        email: "novo.usuario@example.com",
        username: "novo.usuario",
        group: UserGroup.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("should reject duplicated username", async () => {
    dataSource.transaction.mockImplementationOnce(async (callback) => {
      const manager = {
        getRepository: jest.fn((entity) => {
          if (entity === UserEntity) {
            return {
              create: jest.fn(),
              save: jest.fn(),
            };
          }

          return {
            findOne: jest
              .fn()
              .mockResolvedValue({ idAuthCredentials: "existing" }),
            create: jest.fn(),
            save: jest.fn(),
          };
        }),
      };

      return callback(manager as never);
    });

    let thrownError: unknown;

    try {
      await service.execute("admin-id", {
        name: "Novo Usuario",
        email: "novo.usuario@example.com",
        username: "novo.usuario",
        group: UserGroup.USER,
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(AppException);
    expect(thrownError).toMatchObject({
      status: HttpStatus.CONFLICT,
      response: {
        code: APP_ERRORS.auth.duplicateUsername.code,
      },
    });
  });
});
