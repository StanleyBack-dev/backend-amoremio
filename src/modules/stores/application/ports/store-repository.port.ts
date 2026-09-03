import type { StoreContact } from "@/modules/stores/domain/entities/store.entity";
import type { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

export type CreateStorePayload = StoreContact & {
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  createdByUserId: string;
  ownerUserId: string;
};

export type UpdateStorePayload = StoreContact & {
  idStore: string;
  name?: string;
  legalName?: string | null;
  cnpj?: string | null;
  status?: boolean;
};

export type StoreView = {
  idStore: string;
  name: string;
  legalName: string | null;
  cnpj: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  ifoodUrl: string | null;
  food99Url: string | null;
  status: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreMembershipView = {
  idStoreMembership: string;
  idStore: string;
  idUsers: string;
  role: StoreRole;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreWithRoleView = StoreView & { role: StoreRole };

export type StoreMemberView = StoreMembershipView & {
  name: string;
  email: string;
  username?: string;
};

export interface StoreRepositoryPort {
  create(payload: CreateStorePayload): Promise<StoreView>;
  findById(idStore: string): Promise<StoreView | null>;
  update(payload: UpdateStorePayload): Promise<StoreView>;

  listByMember(idUsers: string): Promise<StoreWithRoleView[]>;
  listAll(): Promise<StoreView[]>;
  countAll(): Promise<number>;

  findMembership(
    idStore: string,
    idUsers: string,
  ): Promise<StoreMembershipView | null>;
  listMembers(idStore: string): Promise<StoreMemberView[]>;
  countOwners(idStore: string): Promise<number>;

  addMember(
    idStore: string,
    idUsers: string,
    role: StoreRole,
  ): Promise<StoreMembershipView>;
  updateMemberRole(
    idStoreMembership: string,
    role: StoreRole,
  ): Promise<StoreMembershipView>;
  removeMember(idStoreMembership: string): Promise<void>;
}

export const STORE_REPOSITORY = Symbol("STORE_REPOSITORY");
