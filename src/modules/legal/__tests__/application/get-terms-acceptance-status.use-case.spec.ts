import { GetTermsAcceptanceStatusUseCase } from "@/modules/legal/application/use-cases/get-terms-acceptance-status.use-case";

function buildUseCase(
  overrides: {
    latest?: { termsVersion: string; acceptedAt: Date } | null;
  } = {},
) {
  const termsAcceptanceRepository = {
    create: jest.fn(),
    findLatestByUserId: jest.fn().mockResolvedValue(overrides.latest ?? null),
  };

  const useCase = new GetTermsAcceptanceStatusUseCase(
    termsAcceptanceRepository as never,
  );

  return { useCase, termsAcceptanceRepository };
}

describe("GetTermsAcceptanceStatusUseCase", () => {
  it("reports not accepted when there is no acceptance record", async () => {
    const { useCase } = buildUseCase({ latest: null });

    const status = await useCase.execute("user-1");

    expect(status).toEqual({
      accepted: false,
      acceptedAt: null,
      termsVersion: null,
    });
  });

  it("reports the latest accepted version and timestamp", async () => {
    const acceptedAt = new Date("2026-08-13T12:00:00.000Z");
    const { useCase } = buildUseCase({
      latest: { termsVersion: "2026-08-13", acceptedAt },
    });

    const status = await useCase.execute("user-1");

    expect(status).toEqual({
      accepted: true,
      acceptedAt,
      termsVersion: "2026-08-13",
    });
  });
});
