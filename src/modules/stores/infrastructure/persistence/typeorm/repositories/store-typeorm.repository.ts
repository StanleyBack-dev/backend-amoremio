import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import {
  type CreateStorePayload,
  type StoreMemberView,
  type StoreMembershipView,
  type StoreRepositoryPort,
  type StoreView,
  type StoreWithRoleView,
  type UpdateStorePayload,
} from "@/modules/stores/application/ports/store-repository.port";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";
import { StoreEntity } from "@/modules/stores/infrastructure/persistence/typeorm/entities/store.entity";
import { StoreMembershipEntity } from "@/modules/stores/infrastructure/persistence/typeorm/entities/store-membership.entity";

@Injectable()
export class StoreTypeormRepository implements StoreRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(StoreMembershipEntity)
    private readonly membershipRepository: Repository<StoreMembershipEntity>,
  ) {}

  async create(payload: CreateStorePayload): Promise<StoreView> {
    const idStore = await this.dataSource.transaction(async (manager) => {
      const store = await manager.getRepository(StoreEntity).save(
        manager.getRepository(StoreEntity).create({
          name: payload.name,
          legalName: payload.legalName ?? null,
          cnpj: payload.cnpj ?? null,
          whatsapp: payload.whatsapp ?? null,
          email: payload.email ?? null,
          instagram: payload.instagram ?? null,
          ifoodUrl: payload.ifoodUrl ?? null,
          food99Url: payload.food99Url ?? null,
          status: true,
          createdByUserId: payload.createdByUserId,
        }),
      );

      await manager.getRepository(StoreMembershipEntity).save(
        manager.getRepository(StoreMembershipEntity).create({
          idStore: store.idStore,
          idUsers: payload.ownerUserId,
          role: StoreRole.DONO,
        }),
      );

      return store.idStore;
    });

    const created = await this.storeRepository.findOneOrFail({
      where: { idStore },
    });
    return this.mapStoreToView(created);
  }

  async findById(idStore: string): Promise<StoreView | null> {
    const store = await this.storeRepository.findOne({ where: { idStore } });
    return store ? this.mapStoreToView(store) : null;
  }

  async update(payload: UpdateStorePayload): Promise<StoreView> {
    const store = await this.storeRepository.findOne({
      where: { idStore: payload.idStore },
    });

    if (!store) {
      throw AppException.from(APP_ERRORS.stores.notFound, undefined);
    }

    if (payload.name !== undefined) {
      store.name = payload.name;
    }
    if (payload.legalName !== undefined) {
      store.legalName = payload.legalName;
    }
    if (payload.cnpj !== undefined) {
      store.cnpj = payload.cnpj;
    }
    if (payload.whatsapp !== undefined) {
      store.whatsapp = payload.whatsapp;
    }
    if (payload.email !== undefined) {
      store.email = payload.email;
    }
    if (payload.instagram !== undefined) {
      store.instagram = payload.instagram;
    }
    if (payload.ifoodUrl !== undefined) {
      store.ifoodUrl = payload.ifoodUrl;
    }
    if (payload.food99Url !== undefined) {
      store.food99Url = payload.food99Url;
    }
    if (payload.status !== undefined) {
      store.status = payload.status;
    }

    const saved = await this.storeRepository.save(store);
    return this.mapStoreToView(saved);
  }

  async listByMember(idUsers: string): Promise<StoreWithRoleView[]> {
    const memberships = await this.membershipRepository.find({
      where: { idUsers },
      order: { createdAt: "ASC" },
    });

    if (memberships.length === 0) {
      return [];
    }

    const storesById = new Map(
      (
        await this.storeRepository.find({
          where: {
            idStore: In(memberships.map((membership) => membership.idStore)),
          },
        })
      ).map((store) => [store.idStore, store]),
    );

    return memberships
      .map((membership) => {
        const store = storesById.get(membership.idStore);
        return store
          ? { ...this.mapStoreToView(store), role: membership.role }
          : null;
      })
      .filter((row): row is StoreWithRoleView => row !== null);
  }

  async listAll(): Promise<StoreView[]> {
    const stores = await this.storeRepository.find({
      order: { createdAt: "ASC" },
    });
    return stores.map((store) => this.mapStoreToView(store));
  }

  async countAll(): Promise<number> {
    return this.storeRepository.count();
  }

  async findMembership(
    idStore: string,
    idUsers: string,
  ): Promise<StoreMembershipView | null> {
    const membership = await this.membershipRepository.findOne({
      where: { idStore, idUsers },
    });
    return membership ? this.mapMembershipToView(membership) : null;
  }

  async listMembers(idStore: string): Promise<StoreMemberView[]> {
    const memberships = await this.membershipRepository.find({
      where: { idStore },
      order: { createdAt: "ASC" },
    });

    if (memberships.length === 0) {
      return [];
    }

    const userIds = memberships.map((membership) => membership.idUsers);
    const users = new Map(
      (
        await this.dataSource
          .getRepository(UserEntity)
          .find({ where: { idUsers: In(userIds) } })
      ).map((user) => [user.idUsers, user]),
    );
    const credentials = new Map(
      (
        await this.dataSource
          .getRepository(AuthCredentialEntity)
          .find({ where: { idUsers: In(userIds) } })
      ).map((credential) => [credential.idUsers, credential]),
    );

    return memberships.map((membership) => {
      const user = users.get(membership.idUsers);
      return {
        ...this.mapMembershipToView(membership),
        name: user?.name ?? "—",
        email: user?.email ?? "—",
        username: credentials.get(membership.idUsers)?.username,
      };
    });
  }

  async countOwners(idStore: string): Promise<number> {
    return this.membershipRepository.count({
      where: { idStore, role: StoreRole.DONO },
    });
  }

  async addMember(
    idStore: string,
    idUsers: string,
    role: StoreRole,
  ): Promise<StoreMembershipView> {
    const saved = await this.membershipRepository.save(
      this.membershipRepository.create({ idStore, idUsers, role }),
    );
    return this.mapMembershipToView(saved);
  }

  async updateMemberRole(
    idStoreMembership: string,
    role: StoreRole,
  ): Promise<StoreMembershipView> {
    const membership = await this.membershipRepository.findOne({
      where: { idStoreMembership },
    });

    if (!membership) {
      throw AppException.from(APP_ERRORS.stores.memberNotFound, undefined);
    }

    membership.role = role;
    const saved = await this.membershipRepository.save(membership);
    return this.mapMembershipToView(saved);
  }

  async removeMember(idStoreMembership: string): Promise<void> {
    await this.membershipRepository.delete({ idStoreMembership });
  }

  private mapStoreToView(entity: StoreEntity): StoreView {
    return {
      idStore: entity.idStore,
      name: entity.name,
      legalName: entity.legalName ?? null,
      cnpj: entity.cnpj ?? null,
      whatsapp: entity.whatsapp ?? null,
      email: entity.email ?? null,
      instagram: entity.instagram ?? null,
      ifoodUrl: entity.ifoodUrl ?? null,
      food99Url: entity.food99Url ?? null,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapMembershipToView(
    entity: StoreMembershipEntity,
  ): StoreMembershipView {
    return {
      idStoreMembership: entity.idStoreMembership,
      idStore: entity.idStore,
      idUsers: entity.idUsers,
      role: entity.role,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
