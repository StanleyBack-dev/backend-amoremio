import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type { AppErrorDefinition } from "@/common/exceptions/app-error-definition.type";
import type { PermissionParams } from "@/common/exceptions/catalogs/catalog-params.type";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { GROUP_PERMISSIONS } from "@/modules/auth/domain/constants/group-permissions.constant";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { UserPageAccessEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/user-page-access.entity";
import { GROUP_DEFAULT_PAGE_ACCESS } from "@/modules/auth/domain/constants/group-page-access.constant";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserPageAccessEntity)
    private readonly userPageAccessRepository?: Repository<UserPageAccessEntity>,
  ) {}

  async assertPermissionForUserId(
    userId: string,
    permission: AuthPermission,
  ): Promise<void> {
    await this.assertPermissionsForUserId(userId, [permission]);
  }

  async assertPermissionsForUserId(
    userId: string,
    permissions: AuthPermission[],
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { idUsers: userId },
    });

    if (!user) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    this.assertPermissionsForGroup(user.group, permissions);
  }

  assertPermissionsForGroup(
    group: UserGroup,
    permissions: AuthPermission[],
  ): void {
    const grantedPermissions = new Set(GROUP_PERMISSIONS[group] ?? []);
    const missingPermission = permissions.find(
      (permission) => !grantedPermissions.has(permission),
    );

    if (missingPermission) {
      throw AppException.from<PermissionParams>(
        APP_ERRORS.authorization
          .missingPermission as unknown as AppErrorDefinition<PermissionParams>,
        { group, permission: missingPermission },
      );
    }
  }

  async assertPageAccessForUserId(
    userId: string,
    pageKey: PageAccessKey,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { idUsers: userId },
    });

    if (!user) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    if (!this.userPageAccessRepository) {
      const defaultPermissions = new Set(
        GROUP_DEFAULT_PAGE_ACCESS[user.group] ?? [],
      );
      if (!defaultPermissions.has(pageKey)) {
        throw AppException.from<{ page: string }>(
          APP_ERRORS.authorization.missingPageAccess,
          { page: pageKey },
        );
      }
      return;
    }

    const override = await this.userPageAccessRepository.findOne({
      where: { idUsers: userId, pageKey },
      order: { updatedAt: "DESC" },
    });

    if (override) {
      if (!override.allowed) {
        throw AppException.from<{ page: string }>(
          APP_ERRORS.authorization.missingPageAccess,
          { page: pageKey },
        );
      }
      return;
    }

    const defaultPermissions = new Set(
      GROUP_DEFAULT_PAGE_ACCESS[user.group] ?? [],
    );
    if (!defaultPermissions.has(pageKey)) {
      throw AppException.from<{ page: string }>(
        APP_ERRORS.authorization.missingPageAccess,
        { page: pageKey },
      );
    }
  }
}
