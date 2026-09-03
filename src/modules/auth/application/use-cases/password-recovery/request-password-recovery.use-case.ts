import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { sanitizeSensitiveData } from "@/common/security/sanitize-sensitive-data";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { PasswordRecoveryEmailUseCase } from "@/modules/mails/application/use-cases/password-recovery-email.use-case";
import { AuthCredentialsService } from "../auth-credentials.use-case";
import { PasswordRecoveryCodesService } from "./password-recovery-codes.use-case";

@Injectable()
export class RequestPasswordRecoveryService {
  private readonly logger = new Logger(RequestPasswordRecoveryService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordRecoveryCodesUseCase: PasswordRecoveryCodesService,
    private readonly passwordRecoveryEmailUseCase: PasswordRecoveryEmailUseCase,
  ) {}

  async execute(email: string): Promise<void> {
    const normalizedEmail =
      this.passwordRecoveryCodesUseCase.normalizeEmail(email);

    const user = await this.userRepository.findOne({
      where: { email: ILike(normalizedEmail) },
    });

    if (!user || !user.status || user.inactivatedAt) {
      return;
    }

    const credential = await this.authCredentialsUseCase.findByUserId(
      user.idUsers,
    );

    if (!credential) {
      return;
    }

    const { code, expiresAt } =
      await this.passwordRecoveryCodesUseCase.issuePasswordRecoveryCode(user);

    try {
      await this.passwordRecoveryEmailUseCase.send({
        to: user.email,
        name: user.name,
        code,
        expiresAt,
        username: credential.username,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send password recovery email",
        sanitizeSensitiveData({
          userId: user.idUsers,
          email: user.email,
          error,
        }),
      );
    }
  }
}
