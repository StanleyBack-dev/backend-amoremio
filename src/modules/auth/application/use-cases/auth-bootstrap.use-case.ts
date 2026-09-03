import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { PasswordHasherService } from "./password-hasher.use-case";

@Injectable()
export class AuthBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly passwordHasherUseCase: PasswordHasherService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AuthCredentialEntity)
    private readonly authCredentialRepository: Repository<AuthCredentialEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.bootstrapAdminMaster();
  }

  async bootstrapAdminMaster(): Promise<void> {
    if (!this.isBootstrapEnabled()) {
      return;
    }

    const existingAdminMaster = await this.userRepository.findOne({
      where: { group: UserGroup.ADMIN_MASTER },
    });

    if (existingAdminMaster) {
      return;
    }

    const config = this.getBootstrapConfig();

    const existingEmail = await this.userRepository.findOne({
      where: { email: ILike(config.email) },
    });
    const existingUsername = await this.authCredentialRepository.findOne({
      where: { username: config.username },
    });

    if (existingEmail || existingUsername) {
      await this.reconcileBootstrapAdminMaster(
        config,
        existingEmail,
        existingUsername,
      );
      return;
    }

    const passwordHash = await this.passwordHasherUseCase.hashPassword(
      config.password,
    );

    await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const authCredentialRepository =
        manager.getRepository(AuthCredentialEntity);

      const user = userRepository.create({
        name: config.name,
        email: config.email,
        status: true,
        group: UserGroup.ADMIN_MASTER,
      });

      const savedUser = await userRepository.save(user);

      const credential = authCredentialRepository.create({
        idUsers: savedUser.idUsers,
        username: config.username,
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
      });

      await authCredentialRepository.save(credential);
    });

    this.logger.warn(
      `ADMIN_MASTER inicial criado automaticamente para ${config.email}.`,
    );
  }

  private async reconcileBootstrapAdminMaster(
    config: {
      name: string;
      email: string;
      username: string;
      password: string;
    },
    existingEmail: UserEntity | null,
    existingUsername: AuthCredentialEntity | null,
  ): Promise<void> {
    if (
      existingEmail &&
      existingUsername &&
      existingUsername.idUsers !== existingEmail.idUsers
    ) {
      this.logger.error(
        [
          "Bootstrap do ADMIN_MASTER ignorado por conflito entre email e username.",
          `email=${config.email}`,
          `username=${config.username}`,
        ].join(" "),
      );
      return;
    }

    const targetUser = existingEmail
      ? existingEmail
      : await this.userRepository.findOne({
          where: { idUsers: existingUsername?.idUsers },
        });

    if (!targetUser) {
      this.logger.error(
        `Bootstrap do ADMIN_MASTER ignorado: credencial ${config.username} sem usuário associado.`,
      );
      return;
    }

    targetUser.name = config.name;
    targetUser.email = config.email;
    targetUser.status = true;
    targetUser.group = UserGroup.ADMIN_MASTER;
    targetUser.inactivatedAt = undefined;

    await this.userRepository.save(targetUser);

    const credentialByUser = await this.authCredentialRepository.findOne({
      where: { idUsers: targetUser.idUsers },
    });

    if (credentialByUser) {
      if (
        credentialByUser.username !== config.username &&
        existingUsername &&
        existingUsername.idUsers !== targetUser.idUsers
      ) {
        this.logger.error(
          [
            "Bootstrap do ADMIN_MASTER reconciliou o usuário, mas manteve username atual por conflito.",
            `userId=${targetUser.idUsers}`,
            `currentUsername=${credentialByUser.username}`,
            `desiredUsername=${config.username}`,
          ].join(" "),
        );
      } else {
        credentialByUser.username = config.username;
      }

      await this.authCredentialRepository.save(credentialByUser);
      this.logger.warn(
        `ADMIN_MASTER inicial reconciliado para o usuário existente ${config.email}.`,
      );
      return;
    }

    if (existingUsername && existingUsername.idUsers !== targetUser.idUsers) {
      this.logger.error(
        [
          "Bootstrap do ADMIN_MASTER ignorou a criação da credencial por conflito de username.",
          `userId=${targetUser.idUsers}`,
          `desiredUsername=${config.username}`,
        ].join(" "),
      );
      return;
    }

    const passwordHash = await this.passwordHasherUseCase.hashPassword(
      config.password,
    );

    const credential = this.authCredentialRepository.create({
      idUsers: targetUser.idUsers,
      username: config.username,
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
    });

    await this.authCredentialRepository.save(credential);

    this.logger.warn(
      `ADMIN_MASTER inicial reconciliado com nova credencial para ${config.email}.`,
    );
  }

  private isBootstrapEnabled(): boolean {
    return (
      this.configService.get<boolean>("BOOTSTRAP_ADMIN_MASTER_ENABLED") === true
    );
  }

  private getBootstrapConfig() {
    const name = this.configService.get<string>("BOOTSTRAP_ADMIN_MASTER_NAME");
    const email = this.configService.get<string>(
      "BOOTSTRAP_ADMIN_MASTER_EMAIL",
    );
    const username = this.configService.get<string>(
      "BOOTSTRAP_ADMIN_MASTER_USERNAME",
    );
    const password = this.configService.get<string>(
      "BOOTSTRAP_ADMIN_MASTER_PASSWORD",
    );

    if (!name || !email || !username || !password) {
      throw AppException.from(
        APP_ERRORS.auth.bootstrapIncompleteConfig,
        undefined,
      );
    }

    return {
      name,
      email: email.trim().toLowerCase(),
      username,
      password,
    };
  }
}
