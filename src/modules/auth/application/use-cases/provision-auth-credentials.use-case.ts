import { Injectable } from "@nestjs/common";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { PasswordHasherService } from "./password-hasher.use-case";

interface ProvisionAuthCredentialsInput {
  idUsers: string;
  username: string;
}

@Injectable()
export class ProvisionAuthCredentialsService {
  constructor(
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
  ) {}

  async execute(input: ProvisionAuthCredentialsInput) {
    const temporaryPassword =
      this.passwordHasherUseCase.generateTemporaryPassword();
    const passwordHash =
      await this.passwordHasherUseCase.hashPassword(temporaryPassword);

    const credential = await this.authCredentialsUseCase.provisionCredential({
      idUsers: input.idUsers,
      username: input.username,
      passwordHash,
    });

    return {
      credential,
      temporaryPassword,
    };
  }
}
