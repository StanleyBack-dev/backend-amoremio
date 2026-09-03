import { Inject, Injectable } from "@nestjs/common";
import {
  TERMS_ACCEPTANCE_REPOSITORY,
  type TermsAcceptanceRepositoryPort,
} from "@/modules/legal/application/ports/terms-acceptance-repository.port";

export interface TermsAcceptanceStatusView {
  accepted: boolean;
  acceptedAt: Date | null;
  termsVersion: string | null;
}

@Injectable()
export class GetTermsAcceptanceStatusUseCase {
  constructor(
    @Inject(TERMS_ACCEPTANCE_REPOSITORY)
    private readonly termsAcceptanceRepository: TermsAcceptanceRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<TermsAcceptanceStatusView> {
    const latest =
      await this.termsAcceptanceRepository.findLatestByUserId(idUsers);

    if (!latest) {
      return { accepted: false, acceptedAt: null, termsVersion: null };
    }

    return {
      accepted: true,
      acceptedAt: latest.acceptedAt,
      termsVersion: latest.termsVersion,
    };
  }
}
