import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UpdateUserInputDto } from "@/modules/users/presentation/graphql/dtos/update/update-user-input.dto";
import { UpdateUserResponseDto } from "@/modules/users/presentation/graphql/dtos/update/update-user-response.dto";
import { UpdateUserValidator } from "@/modules/users/application/validators/update/update-user.validator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    userId: string,
    input: UpdateUserInputDto,
  ): Promise<UpdateUserResponseDto> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_USER,
    );

    UpdateUserValidator.ensureValidUpdate(input);

    const user = await this.repo.findOne({
      where: { idUsers: userId },
    });

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    user.name = input.name ?? user.name;
    user.urlAvatar = input.urlAvatar ?? user.urlAvatar;

    if (input.status !== undefined) {
      user.status = input.status;
      user.inactivatedAt = input.status ? undefined : new Date();
    }

    const updated = await this.repo.save(user);

    return {
      idUsers: updated.idUsers,
      name: updated.name,
      email: updated.email,
      urlAvatar: updated.urlAvatar,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }
}
