import type { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

export interface AuthTokenPayload {
  sub: string;
  uid: string;
  username: string;
  group: UserGroup;
  type: "access" | "refresh";
}

export interface AuthenticatedUser {
  idUsers: string;
  username: string;
  group: UserGroup;
}
