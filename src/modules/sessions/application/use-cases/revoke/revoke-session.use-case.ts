import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {}

  async execute(refreshToken: string) {
    const session = await this.repo.findOne({ where: { refreshToken } });

    if (!session) {
      return;
    }

    session.sessionActive = false;
    session.revokedAt = new Date();

    await this.repo.save(session);
  }
}
