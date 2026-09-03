import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update/update-user.use-case";
import { UpdateUserInputDto } from "@/modules/users/presentation/graphql/dtos/update/update-user-input.dto";
import { UpdateUserMutationResponseDto } from "@/modules/users/presentation/graphql/dtos/update/update-user-mutation-response.dto";

@Resolver(() => UpdateUserMutationResponseDto)
export class UpdateUserResolver {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  @Mutation(() => UpdateUserMutationResponseDto)
  @RequirePermissions(AuthPermission.MANAGE_OWN_USER)
  async updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateUserInputDto,
  ) {
    const updatedUser = await this.updateUserUseCase.execute(
      user.idUsers,
      input,
    );

    return buildDataResponse(updatedUser, RESPONSE_MESSAGES.users.updated);
  }
}
