import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import type { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export const userMock: UserEntity = {
  idUsers: "mock-user-id",
  name: "Mock User",
  email: "mock@example.com",
  urlAvatar: "http://mock.com/avatar.png",
  status: true,
  group: UserGroup.USER,
  inactivatedAt: undefined,
  ipAddress: "127.0.0.1",
  userAgent: "jest",
  createdAt: new Date("2024-04-12T00:00:00Z"),
  updatedAt: new Date("2024-04-12T00:00:00Z"),
};
