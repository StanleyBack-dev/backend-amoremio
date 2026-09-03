import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateTermsAcceptancePayload,
  TermsAcceptanceRepositoryPort,
  TermsAcceptanceView,
} from "@/modules/legal/application/ports/terms-acceptance-repository.port";
import { TermsAcceptanceEntity } from "@/modules/legal/infrastructure/persistence/typeorm/entities/terms-acceptance.entity";

@Injectable()
export class TermsAcceptanceTypeormRepository implements TermsAcceptanceRepositoryPort {
  constructor(
    @InjectRepository(TermsAcceptanceEntity)
    private readonly repository: Repository<TermsAcceptanceEntity>,
  ) {}

  async create(payload: CreateTermsAcceptancePayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }

  async findLatestByUserId(
    idUsers: string,
  ): Promise<TermsAcceptanceView | null> {
    const entity = await this.repository.findOne({
      where: { idUsers },
      order: { acceptedAt: "DESC" },
    });

    if (!entity) {
      return null;
    }

    return {
      termsVersion: entity.termsVersion,
      acceptedAt: entity.acceptedAt,
    };
  }
}
