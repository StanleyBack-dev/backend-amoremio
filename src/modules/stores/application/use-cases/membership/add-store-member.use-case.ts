import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  STORE_REPOSITORY,
  type StoreMemberView,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";
import { AddStoreMemberCommand } from "@/modules/stores/application/dto/membership.commands";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

@Injectable()
export class AddStoreMemberUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: AddStoreMemberCommand,
  ): Promise<StoreMemberView[]> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_STORE_MEMBERS,
    );

    const store = await this.storeRepository.findById(command.idStore);
    if (!store) {
      throw AppException.from(APP_ERRORS.stores.notFound, undefined);
    }

    const targetUser = await this.userRepository.findOne({
      where: { idUsers: command.idUsers },
    });
    if (!targetUser) {
      throw AppException.from(APP_ERRORS.stores.targetUserNotFound, undefined);
    }

    const existing = await this.storeRepository.findMembership(
      command.idStore,
      command.idUsers,
    );
    if (existing) {
      throw AppException.from(APP_ERRORS.stores.memberAlreadyExists, undefined);
    }

    await this.storeRepository.addMember(
      command.idStore,
      command.idUsers,
      command.role,
    );

    return this.storeRepository.listMembers(command.idStore);
  }
}
