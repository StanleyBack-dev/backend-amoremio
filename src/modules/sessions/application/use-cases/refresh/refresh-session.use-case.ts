import { Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";
import { SaveSessionUseCase } from "@/modules/sessions/application/use-cases/save/save-session.use-case";

@Injectable()
export class RefreshSessionUseCase {
  constructor(private readonly saveSessionUseCase: SaveSessionUseCase) {}

  async execute(session: SessionEntity) {
    if (session.refreshTokenExpiresAt < new Date()) {
      throw AppException.from(APP_ERRORS.auth.expiredSession, undefined);
    }

    session.lastUsedAt = new Date();
    await this.saveSessionUseCase.execute(session);
  }
}
