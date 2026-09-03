import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { UnlockUserCredentialUseCase } from "@/modules/users/application/use-cases/update/unlock-user-credential.use-case";
import { UnlockUserCredentialInputDto } from "@/modules/users/presentation/graphql/dtos/update/unlock-user-credential-input.dto";
import { UnlockUserCredentialMutationResponseDto } from "@/modules/users/presentation/graphql/dtos/update/unlock-user-credential-mutation-response.dto";

@Resolver(() => UnlockUserCredentialMutationResponseDto)
@RequirePageAccess(PageAccessKey.ADMIN)
export class UnlockUserCredentialResolver {
  constructor(
    private readonly unlockUserCredentialUseCase: UnlockUserCredentialUseCase,
  ) {}

  @Mutation(() => UnlockUserCredentialMutationResponseDto)
  @RequirePermissions(AuthPermission.MANAGE_USERS)
  async unlockUserCredential(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UnlockUserCredentialInputDto,
  ) {
    const result = await this.unlockUserCredentialUseCase.execute(
      user.idUsers,
      input,
    );

    return buildDataResponse(result, RESPONSE_MESSAGES.users.unlocked);
  }
}
