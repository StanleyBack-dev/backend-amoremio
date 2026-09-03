import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";

@Injectable()
export class ValidateSessionUseCase {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {}

  async execute(refreshToken: string, userId: string) {
    return this.repo.findOne({
      where: {
        refreshToken,
        idUsers: userId,
        sessionActive: true,
      },
      relations: ["user"],
    });
  }
}
