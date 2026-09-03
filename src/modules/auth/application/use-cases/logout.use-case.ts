import { Injectable } from "@nestjs/common";
import { RevokeSessionUseCase } from "@/modules/sessions/application/use-cases/revoke/revoke-session.use-case";

@Injectable()
export class LogoutService {
  constructor(private readonly revokeSessionUseCase: RevokeSessionUseCase) {}

  async execute(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.revokeSessionUseCase.execute(refreshToken);
  }
}
