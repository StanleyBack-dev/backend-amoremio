import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {}

  async execute(data: Partial<SessionEntity>) {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }
}
