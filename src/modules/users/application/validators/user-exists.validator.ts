import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { GetUsersUseCase } from "@/modules/users/application/use-cases/get/get-users.use-case";

@Injectable()
export class UserExistsValidator {
  constructor(private readonly getUsersUseCase: GetUsersUseCase) {}

  /**
   * Garante que o e-mail NÃO existe no banco.
   * Se existir, lança 409 (Conflict).
   * Útil para rotas de cadastro manual (se houver).
   */
  async ensureUserDoesNotExistByEmail(email: string): Promise<void> {
    const existing = await this.getUsersUseCase.findByEmail(email);

    if (existing) {
      throw AppException.from(APP_ERRORS.users.emailAlreadyExists, undefined);
    }
  }
}
