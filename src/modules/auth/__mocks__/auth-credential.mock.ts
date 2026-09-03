import type { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { userMock } from "@/modules/users/__mocks__/user.mock";

export const authCredentialMock: AuthCredentialEntity = {
  idAuthCredentials: "mock-auth-credential-id",
  idUsers: userMock.idUsers,
  user: userMock,
  username: "mock.user",
  passwordHash: "salt:hash",
  mustChangePassword: true,
  onboardingTourCompleted: false,
  termsAcceptedAt: undefined,
  temporaryPasswordCreatedAt: new Date("2024-04-12T00:00:00Z"),
  passwordChangedAt: undefined,
  lastLoginAt: undefined,
  failedLoginAttempts: 0,
  lockUntil: undefined,
  createdAt: new Date("2024-04-12T00:00:00Z"),
  updatedAt: new Date("2024-04-12T00:00:00Z"),
};
