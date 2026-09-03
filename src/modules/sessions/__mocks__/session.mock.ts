import type { SessionEntity } from "../infrastructure/persistence/typeorm/entities/session.entity";

export const sessionMock: SessionEntity = {
  idUsersSessions: "mock-session-id",
  idUsers: "mock-user-id",
  refreshToken: "mock-refresh-token",
  ipAddress: "127.0.0.1",
  userAgent: "jest",
  sessionActive: true,
  refreshTokenExpiresAt: new Date("2099-12-31T00:00:00Z"),
  revokedAt: undefined,
  lastUsedAt: new Date("2024-04-12T00:00:00Z"),
  createdAt: new Date("2024-04-12T00:00:00Z"),
  updatedAt: new Date("2024-04-12T00:00:00Z"),
  user: undefined as never,
};
