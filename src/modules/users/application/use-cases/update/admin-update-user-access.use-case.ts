import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { AdminUpdateUserAccessInputDto } from "@/modules/users/presentation/graphql/dtos/update/admin-update-user-access-input.dto";
import { AdminUpdateUserAccessResponseDto } from "@/modules/users/presentation/graphql/dtos/update/admin-update-user-access-response.dto";
import { UserPageAccessUseCase } from "@/modules/users/application/use-cases/permissions/user-page-access.use-case";

@Injectable()
export class AdminUpdateUserAccessUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly authorizationService: AuthorizationService,
    private readonly userPageAccessUseCase: UserPageAccessUseCase,
  ) {}

  async execute(
    currentUserId: string,
    input: AdminUpdateUserAccessInputDto,
  ): Promise<AdminUpdateUserAccessResponseDto> {
    await this.authorizationService.assertPermissionForUserId(
      currentUserId,
      AuthPermission.MANAGE_USERS,
    );

    if (
      input.group === undefined &&
      input.status === undefined &&
      input.pagePermissions === undefined &&
      input.useGroupDefaults === undefined
    ) {
      throw AppException.from(APP_ERRORS.users.invalidUpdateInput, undefined);
    }

    const user = await this.repo.findOne({
      where: { idUsers: input.idUsers },
    });

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    if (input.group !== undefined) {
      user.group = input.group;
    }

    if (input.status !== undefined) {
      user.status = input.status;
      user.inactivatedAt = input.status ? undefined : new Date();
    }

    const updated = await this.repo.save(user);

    if (
      input.pagePermissions !== undefined ||
      input.useGroupDefaults !== undefined
    ) {
      await this.userPageAccessUseCase.setForUser(currentUserId, {
        idUsers: input.idUsers,
        pagePermissions: input.pagePermissions,
        useGroupDefaults: input.useGroupDefaults ?? false,
      });
    }

    return {
      idUsers: updated.idUsers,
      group: updated.group,
      status: updated.status,
      inactivatedAt: updated.inactivatedAt ?? undefined,
      updatedAt: updated.updatedAt,
    };
  }
}
