import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildPaginatedListResponse } from "@/common/responses/helpers/response.helper";
import { AllowFirstAccess } from "@/modules/auth/presentation/decorators/allow-first-access.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetUsersUseCase } from "@/modules/users/application/use-cases/get/get-users.use-case";
import { GetUserInputDto } from "@/modules/users/presentation/graphql/dtos/get/get-user-input.dto";
import { GetUserResponseDto } from "@/modules/users/presentation/graphql/dtos/get/get-user-response.dto";
import { GetUsersInputDto } from "@/modules/users/presentation/graphql/dtos/get/get-users-input.dto";
import { GetUsersListResponseDto } from "@/modules/users/presentation/graphql/dtos/get/get-users-list-response.dto";
import { UserFilterOptionDto } from "@/modules/users/presentation/graphql/dtos/get/user-filter-option.dto";

@Resolver()
export class GetUsersResolver {
  constructor(private readonly getUsersUseCase: GetUsersUseCase) {}

  @Query(() => GetUsersListResponseDto, { name: "getUsers" })
  @RequirePageAccess(PageAccessKey.ADMIN)
  @RequirePermissions(AuthPermission.READ_USERS)
  async getUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetUsersInputDto,
  ) {
    const result = await this.getUsersUseCase.findAll(user.idUsers, input);

    return buildPaginatedListResponse(result, RESPONSE_MESSAGES.users.listed);
  }

  @Query(() => [UserFilterOptionDto], { name: "getUserFilterOptions" })
  @RequirePageAccess(PageAccessKey.ADMIN)
  @RequirePermissions(AuthPermission.READ_USERS)
  async getUserFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserFilterOptionDto[]> {
    return this.getUsersUseCase.findFilterOptions(user.idUsers);
  }

  @Query(() => GetUserResponseDto, { name: "getUser" })
  @RequirePageAccess(PageAccessKey.ADMIN)
  @RequirePermissions(AuthPermission.READ_USERS)
  async getUser(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetUserInputDto,
  ): Promise<GetUserResponseDto> {
    return this.getUsersUseCase.findOne(user.idUsers, input);
  }

  @Query(() => GetUserResponseDto, { name: "me" })
  @AllowFirstAccess()
  @RequirePermissions(AuthPermission.READ_OWN_USER)
  async me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GetUserResponseDto> {
    return this.getUsersUseCase.findByIdOrFail(user.idUsers);
  }
}
