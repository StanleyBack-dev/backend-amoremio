import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AdminUpdateUserAccessUseCase } from "@/modules/users/application/use-cases/update/admin-update-user-access.use-case";
import { AdminUpdateUserAccessInputDto } from "@/modules/users/presentation/graphql/dtos/update/admin-update-user-access-input.dto";
import { AdminUpdateUserAccessMutationResponseDto } from "@/modules/users/presentation/graphql/dtos/update/admin-update-user-access-mutation-response.dto";

@Resolver(() => AdminUpdateUserAccessMutationResponseDto)
@RequirePageAccess(PageAccessKey.ADMIN)
export class AdminUpdateUserAccessResolver {
  constructor(
    private readonly adminUpdateUserAccessUseCase: AdminUpdateUserAccessUseCase,
  ) {}

  @Mutation(() => AdminUpdateUserAccessMutationResponseDto)
  @RequirePermissions(AuthPermission.MANAGE_USERS)
  async adminUpdateUserAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AdminUpdateUserAccessInputDto,
  ) {
    const updatedUser = await this.adminUpdateUserAccessUseCase.execute(
      user.idUsers,
      input,
    );

    return buildDataResponse(
      updatedUser,
      RESPONSE_MESSAGES.users.accessUpdated,
    );
  }
}
