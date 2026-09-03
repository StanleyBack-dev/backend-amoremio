import { Inject, Injectable } from "@nestjs/common";
import type { IRequestInfo } from "@/common/decorators/request-info.decorator";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CURRENT_TERMS_VERSION } from "@/modules/legal/domain/constants/terms-version.constant";
import {
  TERMS_ACCEPTANCE_REPOSITORY,
  type TermsAcceptanceRepositoryPort,
} from "@/modules/legal/application/ports/terms-acceptance-repository.port";

@Injectable()
export class AcceptTermsOfUseUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(TERMS_ACCEPTANCE_REPOSITORY)
    private readonly termsAcceptanceRepository: TermsAcceptanceRepositoryPort,
    private readonly authCredentialsService: AuthCredentialsService,
  ) {}

  async execute(idUsers: string, requestInfo?: IRequestInfo): Promise<void> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    const acceptedAt = new Date();

    await this.termsAcceptanceRepository.create({
      idUsers,
      termsVersion: CURRENT_TERMS_VERSION,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      acceptedAt,
    });

    await this.authCredentialsService.acceptTermsOfUse(
      idUsers,
      acceptedAt,
      CURRENT_TERMS_VERSION,
    );
  }
}
