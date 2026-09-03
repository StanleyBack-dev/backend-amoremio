import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  STORE_REPOSITORY,
  type StoreMemberView,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";
import { UpdateStoreMemberRoleCommand } from "@/modules/stores/application/dto/membership.commands";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@Injectable()
export class UpdateStoreMemberRoleUseCase {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateStoreMemberRoleCommand,
  ): Promise<StoreMemberView[]> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_STORE_MEMBERS,
    );

    const membership = await this.storeRepository.findMembership(
      command.idStore,
      command.idUsers,
    );
    if (!membership) {
      throw AppException.from(APP_ERRORS.stores.memberNotFound, undefined);
    }

    // Demoting the only remaining DONO would leave the store without an
    // owner — block it until another member is promoted first.
    if (membership.role === StoreRole.DONO && command.role !== StoreRole.DONO) {
      const owners = await this.storeRepository.countOwners(command.idStore);
      if (owners <= 1) {
        throw AppException.from(APP_ERRORS.stores.lastOwner, undefined);
      }
    }

    await this.storeRepository.updateMemberRole(
      membership.idStoreMembership,
      command.role,
    );

    return this.storeRepository.listMembers(command.idStore);
  }
}
