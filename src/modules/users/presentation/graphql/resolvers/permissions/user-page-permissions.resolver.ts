import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { AllowBeforeTermsAcceptance } from "@/modules/auth/presentation/decorators/allow-before-terms-acceptance.decorator";
import { AllowFirstAccess } from "@/modules/auth/presentation/decorators/allow-first-access.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { UserPageAccessUseCase } from "@/modules/users/application/use-cases/permissions/user-page-access.use-case";
import { GetUserPagePermissionsInputDto } from "@/modules/users/presentation/graphql/dtos/permissions/get-user-page-permissions-input.dto";
import { SetUserPagePermissionsInputDto } from "@/modules/users/presentation/graphql/dtos/permissions/set-user-page-permissions-input.dto";
import { SetUserPagePermissionsMutationResponseDto } from "@/modules/users/presentation/graphql/dtos/permissions/set-user-page-permissions-mutation-response.dto";
import { UserPagePermissionsResponseDto } from "@/modules/users/presentation/graphql/dtos/permissions/user-page-permissions-response.dto";

@Resolver()
export class UserPagePermissionsResolver {
  constructor(private readonly userPageAccessUseCase: UserPageAccessUseCase) {}

  @Query(() => UserPagePermissionsResponseDto, {
    name: "getUserPagePermissions",
  })
  @RequirePageAccess(PageAccessKey.ADMIN)
  @RequirePermissions(AuthPermission.MANAGE_USERS)
  async getUserPagePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetUserPagePermissionsInputDto,
  ): Promise<UserPagePermissionsResponseDto> {
    return this.userPageAccessUseCase.getByUserIdManaged(
      user.idUsers,
      input.idUsers,
    );
  }

  @Query(() => UserPagePermissionsResponseDto, { name: "getMyPagePermissions" })
  @AllowFirstAccess()
  @AllowBeforeTermsAcceptance()
  @RequirePermissions(AuthPermission.READ_OWN_USER)
  async getMyPagePermissions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserPagePermissionsResponseDto> {
    return this.userPageAccessUseCase.getByUserId(user.idUsers);
  }

  @Mutation(() => SetUserPagePermissionsMutationResponseDto)
  @RequirePageAccess(PageAccessKey.ADMIN)
  @RequirePermissions(AuthPermission.MANAGE_USERS)
  async setUserPagePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SetUserPagePermissionsInputDto,
  ) {
    const result = await this.userPageAccessUseCase.setForUser(
      user.idUsers,
      input,
    );

    return buildDataResponse(
      result,
      RESPONSE_MESSAGES.users.permissionsUpdated,
    );
  }
}
