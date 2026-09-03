import { AcceptTermsOfUseUseCase } from "@/modules/legal/application/use-cases/accept-terms-of-use.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CURRENT_TERMS_VERSION } from "@/modules/legal/domain/constants/terms-version.constant";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const termsAcceptanceRepository = {
    create: jest.fn().mockResolvedValue(undefined),
    findLatestByUserId: jest.fn(),
  };

  const authCredentialsService = {
    acceptTermsOfUse: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new AcceptTermsOfUseUseCase(
    authorizationService as never,
    termsAcceptanceRepository as never,
    authCredentialsService as never,
  );

  return {
    useCase,
    authorizationService,
    termsAcceptanceRepository,
    authCredentialsService,
  };
}

describe("AcceptTermsOfUseUseCase", () => {
  it("checks permission before recording the acceptance", async () => {
    const { useCase, authorizationService } = buildUseCase();

    await useCase.execute("user-1", {
      ipAddress: "127.0.0.1",
      userAgent: "jest",
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_PROFILE,
    );
  });

  it("persists the audit record with the current terms version and request info", async () => {
    const { useCase, termsAcceptanceRepository } = buildUseCase();

    await useCase.execute("user-1", {
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0",
    });

    expect(termsAcceptanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        termsVersion: CURRENT_TERMS_VERSION,
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
        acceptedAt: expect.any(Date),
      }),
    );
  });

  it("flips the fast-access flag on the auth credentials with the same timestamp", async () => {
    const { useCase, termsAcceptanceRepository, authCredentialsService } =
      buildUseCase();

    await useCase.execute("user-1", {});

    const [{ acceptedAt }] = termsAcceptanceRepository.create.mock.calls[0];
    expect(authCredentialsService.acceptTermsOfUse).toHaveBeenCalledWith(
      "user-1",
      acceptedAt,
      CURRENT_TERMS_VERSION,
    );
  });

  it("does not throw when request info is unavailable (e.g. non-HTTP context)", async () => {
    const { useCase, termsAcceptanceRepository } = buildUseCase();

    await useCase.execute("user-1", undefined);

    expect(termsAcceptanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        ipAddress: undefined,
        userAgent: undefined,
      }),
    );
  });
});
