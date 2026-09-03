import type { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

export class AddStoreMemberCommand {
  idStore!: string;
  idUsers!: string;
  role!: StoreRole;
}

export class UpdateStoreMemberRoleCommand {
  idStore!: string;
  idUsers!: string;
  role!: StoreRole;
}

export class RemoveStoreMemberCommand {
  idStore!: string;
  idUsers!: string;
}
