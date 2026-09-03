import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PasswordHasherService } from "../password-hasher.use-case";
import { PasswordRecoveryCodesService } from "./password-recovery-codes.use-case";

@Injectable()
export class VerifyPasswordRecoveryCodeService {
  constructor(
    private readonly passwordRecoveryCodesUseCase: PasswordRecoveryCodesService,
    private readonly passwordHasherUseCase: PasswordHasherService,
  ) {}

  async execute(email: string, code: string) {
    const activeCode =
      await this.passwordRecoveryCodesUseCase.findLatestValidCodeForEmail(
        email,
      );

    if (!activeCode) {
      throw AppException.from(
        APP_ERRORS.auth.passwordRecoveryCodeInvalidOrExpired,
        undefined,
      );
    }

    const codeMatches = await this.passwordHasherUseCase.verifyPassword(
      code,
      activeCode.codeHash,
    );

    if (!codeMatches) {
      await this.passwordRecoveryCodesUseCase.registerInvalidAttempt(
        activeCode,
      );
      throw AppException.from(
        APP_ERRORS.auth.passwordRecoveryCodeInvalidOrExpired,
        undefined,
      );
    }

    return this.passwordRecoveryCodesUseCase.markVerified(activeCode);
  }
}
