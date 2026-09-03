import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";
import { roleHasPermission } from "@/modules/stores/domain/constants/store-role-permissions.constant";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

export interface StoreAccessContext {
  role: StoreRole | null;
  isPlatformAdmin: boolean;
}

@Injectable()
export class StoreAuthorizationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
  ) {}

  // ADMIN_MASTER runs the platform and is never blocked by a store role.
  private async isPlatformAdmin(idUsers: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    return user?.group === UserGroup.ADMIN_MASTER;
  }

  async resolveContext(
    idUsers: string,
    idStore: string,
  ): Promise<StoreAccessContext> {
    if (await this.isPlatformAdmin(idUsers)) {
      return { role: null, isPlatformAdmin: true };
    }

    const membership = await this.storeRepository.findMembership(
      idStore,
      idUsers,
    );
    return { role: membership?.role ?? null, isPlatformAdmin: false };
  }

  async assertMember(idUsers: string, idStore: string): Promise<void> {
    const context = await this.resolveContext(idUsers, idStore);
    if (!context.isPlatformAdmin && context.role === null) {
      throw AppException.from(APP_ERRORS.stores.notAMember, undefined);
    }
  }

  async assertStorePermission(
    idUsers: string,
    idStore: string,
    permission: StorePermission,
  ): Promise<void> {
    const context = await this.resolveContext(idUsers, idStore);

    if (context.isPlatformAdmin) {
      return;
    }

    if (context.role === null) {
      throw AppException.from(APP_ERRORS.stores.notAMember, undefined);
    }

    if (!roleHasPermission(context.role, permission)) {
      throw AppException.from(APP_ERRORS.stores.missingStorePermission, {
        role: context.role,
        permission,
      });
    }
  }
}
