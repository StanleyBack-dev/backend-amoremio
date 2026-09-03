import { Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { AuthorizationService } from "./authorization.use-case";

@Injectable()
export class CompleteOnboardingTourService {
  constructor(
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly authorizationUseCase: AuthorizationService,
  ) {}

  async execute(idUsers: string): Promise<void> {
    await this.authorizationUseCase.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    await this.authCredentialsUseCase.completeOnboardingTour(idUsers);
  }
}
