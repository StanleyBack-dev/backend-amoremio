import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ChangePasswordInputDto } from "@/modules/auth/presentation/graphql/dtos/password/change-password-input.dto";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { AuthorizationService } from "./authorization.use-case";
import { PasswordHasherService } from "./password-hasher.use-case";

@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly authorizationUseCase: AuthorizationService,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly passwordChangedEmailUseCase: PasswordChangedEmailUseCase,
  ) {}

  async execute(idUsers: string, input: ChangePasswordInputDto): Promise<void> {
    await this.authorizationUseCase.assertPermissionForUserId(
      idUsers,
      AuthPermission.CHANGE_OWN_PASSWORD,
    );

    if (input.currentPassword === input.newPassword) {
      throw AppException.from(APP_ERRORS.auth.newPasswordMustDiffer, undefined);
    }

    const credential =
      await this.authCredentialsUseCase.findByUserIdOrFail(idUsers);
    const passwordMatches = await this.passwordHasherUseCase.verifyPassword(
      input.currentPassword,
      credential.passwordHash,
    );

    if (!passwordMatches) {
      throw AppException.from(
        APP_ERRORS.auth.invalidCurrentPassword,
        undefined,
      );
    }

    const nextPasswordHash = await this.passwordHasherUseCase.hashPassword(
      input.newPassword,
    );

    await this.authCredentialsUseCase.updatePassword(
      credential,
      nextPasswordHash,
    );

    await this.passwordChangedEmailUseCase.send({
      to: credential.user.email,
      name: credential.user.name,
    });
  }
}
