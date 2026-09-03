import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { GROUP_DEFAULT_PAGE_ACCESS } from "@/modules/auth/domain/constants/group-page-access.constant";
import {
  ALL_PAGE_ACCESS_KEYS,
  PageAccessKey,
} from "@/modules/auth/domain/enums/page-access-key.enum";
import { UserPageAccessEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/user-page-access.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserPagePermissionsResponseDto } from "@/modules/users/presentation/graphql/dtos/permissions/user-page-permissions-response.dto";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

interface SetPermissionsInput {
  idUsers: string;
  pagePermissions?: PageAccessKey[];
  useGroupDefaults: boolean;
}

@Injectable()
export class UserPageAccessUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserPageAccessEntity)
    private readonly userPageAccessRepository: Repository<UserPageAccessEntity>,
  ) {}

  async getByUserId(idUsers: string): Promise<UserPagePermissionsResponseDto> {
    const user = await this.userRepository.findOne({ where: { idUsers } });

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    return this.buildPermissionsResponse(user);
  }

  async getByUserIdManaged(
    currentUserId: string,
    idUsers: string,
  ): Promise<UserPagePermissionsResponseDto> {
    await this.assertAdminMaster(currentUserId);
    return this.getByUserId(idUsers);
  }

  async setForUser(
    currentUserId: string,
    input: SetPermissionsInput,
  ): Promise<UserPagePermissionsResponseDto> {
    await this.assertAdminMaster(currentUserId);

    const user = await this.userRepository.findOne({
      where: { idUsers: input.idUsers },
    });

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    if (input.useGroupDefaults) {
      await this.userPageAccessRepository.delete({ idUsers: input.idUsers });
      return this.buildPermissionsResponse(user);
    }

    const requestedPermissions = new Set(input.pagePermissions ?? []);
    const defaultPermissions = new Set(
      GROUP_DEFAULT_PAGE_ACCESS[user.group] ?? [],
    );

    const desiredOverrides = ALL_PAGE_ACCESS_KEYS.reduce(
      (acc, pageKey) => {
        const desired = requestedPermissions.has(pageKey);
        const defaultAllowed = defaultPermissions.has(pageKey);

        if (desired !== defaultAllowed) {
          acc.push({ pageKey, allowed: desired });
        }

        return acc;
      },
      [] as Array<{ pageKey: PageAccessKey; allowed: boolean }>,
    );

    await this.userPageAccessRepository.delete({ idUsers: input.idUsers });

    if (desiredOverrides.length) {
      await this.userPageAccessRepository.save(
        desiredOverrides.map((override) =>
          this.userPageAccessRepository.create({
            idUsers: input.idUsers,
            pageKey: override.pageKey,
            allowed: override.allowed,
          }),
        ),
      );
    }

    return this.buildPermissionsResponse(user);
  }

  async setDuringUserCreation(
    currentUserId: string,
    idUsers: string,
    group: UserEntity["group"],
    pagePermissions?: PageAccessKey[],
  ): Promise<void> {
    if (!pagePermissions || pagePermissions.length === 0) {
      return;
    }

    await this.assertAdminMaster(currentUserId);

    const defaultPermissions = new Set(GROUP_DEFAULT_PAGE_ACCESS[group] ?? []);
    const requestedPermissions = new Set(pagePermissions);

    const desiredOverrides = ALL_PAGE_ACCESS_KEYS.reduce(
      (acc, pageKey) => {
        const desired = requestedPermissions.has(pageKey);
        const defaultAllowed = defaultPermissions.has(pageKey);

        if (desired !== defaultAllowed) {
          acc.push({ pageKey, allowed: desired });
        }

        return acc;
      },
      [] as Array<{ pageKey: PageAccessKey; allowed: boolean }>,
    );

    if (!desiredOverrides.length) {
      return;
    }

    await this.userPageAccessRepository.save(
      desiredOverrides.map((override) =>
        this.userPageAccessRepository.create({
          idUsers,
          pageKey: override.pageKey,
          allowed: override.allowed,
        }),
      ),
    );
  }

  private async assertAdminMaster(currentUserId: string): Promise<void> {
    const currentUser = await this.userRepository.findOne({
      where: { idUsers: currentUserId },
    });

    if (!currentUser) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    if (currentUser.group !== UserGroup.ADMIN_MASTER) {
      throw AppException.from(
        APP_ERRORS.authorization.onlyAdminMasterCanManagePermissions,
        undefined,
      );
    }
  }

  private async buildPermissionsResponse(
    user: UserEntity,
  ): Promise<UserPagePermissionsResponseDto> {
    const overrides = await this.userPageAccessRepository.find({
      where: { idUsers: user.idUsers, pageKey: In(ALL_PAGE_ACCESS_KEYS) },
      order: { updatedAt: "DESC" },
    });

    const defaultPermissions = new Set(
      GROUP_DEFAULT_PAGE_ACCESS[user.group] ?? [],
    );
    const effectiveSet = new Set(defaultPermissions);

    for (const override of overrides) {
      if (override.allowed) {
        effectiveSet.add(override.pageKey);
      } else {
        effectiveSet.delete(override.pageKey);
      }
    }

    const updatedAt = overrides[0]?.updatedAt;

    return {
      idUsers: user.idUsers,
      group: user.group,
      effectivePermissions: ALL_PAGE_ACCESS_KEYS.filter((key) =>
        effectiveSet.has(key),
      ),
      defaultPermissions: ALL_PAGE_ACCESS_KEYS.filter((key) =>
        defaultPermissions.has(key),
      ),
      useGroupDefaults: overrides.length === 0,
      updatedAt,
    };
  }
}
