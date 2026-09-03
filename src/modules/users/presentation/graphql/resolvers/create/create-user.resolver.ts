import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import {
  RequestInfo,
  type IRequestInfo,
} from "@/common/decorators/request-info.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create/create-user.use-case";
import { CreateUserInputDto } from "@/modules/users/presentation/graphql/dtos/create/create-user-input.dto";
import { CreateUserMutationResponseDto } from "@/modules/users/presentation/graphql/dtos/create/create-user-mutation-response.dto";

@Resolver(() => CreateUserMutationResponseDto)
@RequirePageAccess(PageAccessKey.ADMIN)
export class CreateUserResolver {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @RequirePermissions(AuthPermission.MANAGE_USERS)
  @Mutation(() => CreateUserMutationResponseDto, { name: "createUser" })
  async createUser(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateUserInputDto,
    @RequestInfo() requestInfo: IRequestInfo,
  ) {
    const createdUser = await this.createUserUseCase.execute(
      user.idUsers,
      input,
      requestInfo,
    );

    return buildDataResponse(createdUser, RESPONSE_MESSAGES.users.created);
  }
}
