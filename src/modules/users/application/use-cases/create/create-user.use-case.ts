import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { CreateUserInputDto } from "@/modules/users/presentation/graphql/dtos/create/create-user-input.dto";
import { CreateUserResponseDto } from "@/modules/users/presentation/graphql/dtos/create/create-user-response.dto";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserExistsValidator } from "@/modules/users/application/validators/user-exists.validator";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PasswordHasherService } from "@/modules/auth/application/use-cases/password-hasher.use-case";
import type { IRequestInfo } from "@/common/decorators/request-info.decorator";
import { UserOnboardingEmailUseCase } from "@/modules/mails/application/use-cases/user-onboarding-email.use-case";
import { sanitizeSensitiveData } from "@/common/security/sanitize-sensitive-data";
import { UserPageAccessUseCase } from "@/modules/users/application/use-cases/permissions/user-page-access.use-case";

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly authorizationService: AuthorizationService,
    private readonly userExistsValidator: UserExistsValidator,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly dataSource: DataSource,
    private readonly userOnboardingEmailUseCase: UserOnboardingEmailUseCase,
    private readonly userPageAccessUseCase: UserPageAccessUseCase,
  ) {}

  async execute(
    currentUserId: string,
    input: CreateUserInputDto,
    requestInfo?: IRequestInfo,
  ): Promise<CreateUserResponseDto> {
    await this.authorizationService.assertPermissionForUserId(
      currentUserId,
      AuthPermission.MANAGE_USERS,
    );

    const normalizedEmail = input.email.trim().toLowerCase();

    await this.userExistsValidator.ensureUserDoesNotExistByEmail(
      normalizedEmail,
    );

    const temporaryPassword =
      this.passwordHasherService.generateTemporaryPassword();
    const passwordHash =
      await this.passwordHasherService.hashPassword(temporaryPassword);

    const createdUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const authCredentialRepository =
        manager.getRepository(AuthCredentialEntity);

      const existingUsername = await authCredentialRepository.findOne({
        where: { username: input.username },
      });

      if (existingUsername) {
        throw AppException.from(APP_ERRORS.auth.duplicateUsername, undefined);
      }

      const user = userRepository.create({
        name: input.name,
        email: normalizedEmail,
        urlAvatar: input.urlAvatar,
        status: true,
        group: input.group,
        ipAddress: requestInfo?.ipAddress,
        userAgent: requestInfo?.userAgent,
      });

      const savedUser = await userRepository.save(user);

      const credential = authCredentialRepository.create({
        idUsers: savedUser.idUsers,
        username: input.username,
        passwordHash,
        mustChangePassword: true,
        temporaryPasswordCreatedAt: new Date(),
        failedLoginAttempts: 0,
      });

      await authCredentialRepository.save(credential);

      await this.userPageAccessUseCase.setDuringUserCreation(
        currentUserId,
        savedUser.idUsers,
        savedUser.group,
        input.pagePermissions,
      );

      return {
        idUsers: savedUser.idUsers,
        name: savedUser.name,
        email: savedUser.email,
        username: credential.username,
        group: savedUser.group,
        mustChangePassword: credential.mustChangePassword,
        urlAvatar: savedUser.urlAvatar,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
      };
    });

    await this.sendOnboardingEmailSafely({
      to: createdUser.email,
      name: createdUser.name,
      username: createdUser.username,
      temporaryPassword,
    });

    return createdUser;
  }

  private async sendOnboardingEmailSafely(input: {
    to: string;
    name: string;
    username: string;
    temporaryPassword: string;
  }) {
    try {
      await this.userOnboardingEmailUseCase.send(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha no envio de email de onboarding para ${input.to}: ${sanitizeSensitiveData(message)}`,
      );
    }
  }
}
