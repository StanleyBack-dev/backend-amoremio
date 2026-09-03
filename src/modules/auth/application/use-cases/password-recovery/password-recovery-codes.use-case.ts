import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { randomInt, randomUUID } from "crypto";
import { Repository } from "typeorm";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthVerificationCodeEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-verification-code.entity";
import { AuthVerificationPurpose } from "@/modules/auth/domain/enums/auth-verification-purpose.enum";
import { PasswordHasherService } from "../password-hasher.use-case";

interface IssuedPasswordRecoveryCode {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordRecoveryCodesService {
  constructor(
    @InjectRepository(AuthVerificationCodeEntity)
    private readonly verificationCodeRepository: Repository<AuthVerificationCodeEntity>,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly configService: ConfigService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async issuePasswordRecoveryCode(
    user: UserEntity,
  ): Promise<IssuedPasswordRecoveryCode> {
    const normalizedEmail = this.normalizeEmail(user.email);
    await this.invalidateOpenCodes(
      user.idUsers,
      AuthVerificationPurpose.PASSWORD_RECOVERY,
    );

    const code = randomInt(0, 100000).toString().padStart(5, "0");
    const expiresAt = new Date(
      Date.now() + this.getCodeTtlMinutes() * 60 * 1000,
    );
    const codeHash = await this.passwordHasherUseCase.hashPassword(code);

    const entity = this.verificationCodeRepository.create({
      idUsers: user.idUsers,
      purpose: AuthVerificationPurpose.PASSWORD_RECOVERY,
      targetEmail: normalizedEmail,
      codeHash,
      expiresAt,
      attemptCount: 0,
      maxAttempts: this.getMaxAttempts(),
    });

    await this.verificationCodeRepository.save(entity);

    return { code, expiresAt };
  }

  async findLatestValidCodeForEmail(
    email: string,
  ): Promise<AuthVerificationCodeEntity | null> {
    const normalizedEmail = this.normalizeEmail(email);

    return this.verificationCodeRepository
      .createQueryBuilder("code")
      .where("code.targetEmail = :targetEmail", {
        targetEmail: normalizedEmail,
      })
      .andWhere("code.purpose = :purpose", {
        purpose: AuthVerificationPurpose.PASSWORD_RECOVERY,
      })
      .andWhere("code.invalidatedAt IS NULL")
      .andWhere("code.consumedAt IS NULL")
      .andWhere("code.verifiedAt IS NULL")
      .andWhere("code.expiresAt > :now", { now: new Date() })
      .orderBy("code.createdAt", "DESC")
      .getOne();
  }

  async registerInvalidAttempt(
    code: AuthVerificationCodeEntity,
  ): Promise<void> {
    const nextAttempts = code.attemptCount + 1;
    const mustInvalidate = nextAttempts >= code.maxAttempts;

    await this.verificationCodeRepository.update(
      { idAuthVerificationCodes: code.idAuthVerificationCodes },
      {
        attemptCount: nextAttempts,
        invalidatedAt: mustInvalidate ? new Date() : null,
      },
    );
  }

  async markVerified(
    code: AuthVerificationCodeEntity,
  ): Promise<{ recoveryToken: string; expiresAt: Date }> {
    const recoveryToken = randomUUID();
    const expiresAt = new Date(
      Date.now() + this.getResetTokenTtlMinutes() * 60 * 1000,
    );

    await this.verificationCodeRepository.update(
      { idAuthVerificationCodes: code.idAuthVerificationCodes },
      {
        verifiedAt: new Date(),
        resetToken: recoveryToken,
        resetTokenExpiresAt: expiresAt,
      },
    );

    return {
      recoveryToken,
      expiresAt,
    };
  }

  async findByResetToken(
    recoveryToken: string,
  ): Promise<AuthVerificationCodeEntity | null> {
    return this.verificationCodeRepository
      .createQueryBuilder("code")
      .where("code.resetToken = :recoveryToken", { recoveryToken })
      .andWhere("code.purpose = :purpose", {
        purpose: AuthVerificationPurpose.PASSWORD_RECOVERY,
      })
      .andWhere("code.invalidatedAt IS NULL")
      .andWhere("code.consumedAt IS NULL")
      .andWhere("code.verifiedAt IS NOT NULL")
      .andWhere("code.resetTokenExpiresAt > :now", { now: new Date() })
      .orderBy("code.createdAt", "DESC")
      .getOne();
  }

  async consume(code: AuthVerificationCodeEntity): Promise<void> {
    await this.verificationCodeRepository.update(
      { idAuthVerificationCodes: code.idAuthVerificationCodes },
      {
        consumedAt: new Date(),
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    );
  }

  async invalidateOpenCodes(idUsers: string, purpose: AuthVerificationPurpose) {
    await this.verificationCodeRepository
      .createQueryBuilder()
      .update(AuthVerificationCodeEntity)
      .set({
        invalidatedAt: new Date(),
      })
      .where("idUsers = :idUsers", { idUsers })
      .andWhere("purpose = :purpose", { purpose })
      .andWhere("invalidatedAt IS NULL")
      .andWhere("consumedAt IS NULL")
      .execute();
  }

  private getCodeTtlMinutes(): number {
    return this.configService.get<number>(
      "PASSWORD_RECOVERY_CODE_TTL_MINUTES",
      10,
    );
  }

  private getResetTokenTtlMinutes(): number {
    return this.configService.get<number>(
      "PASSWORD_RECOVERY_RESET_TTL_MINUTES",
      15,
    );
  }

  private getMaxAttempts(): number {
    return this.configService.get<number>("PASSWORD_RECOVERY_MAX_ATTEMPTS", 5);
  }
}
