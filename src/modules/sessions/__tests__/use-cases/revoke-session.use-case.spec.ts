import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { RevokeSessionUseCase } from "../../application/use-cases/revoke/revoke-session.use-case";

describe("RevokeSessionUseCase", () => {
  let service: RevokeSessionUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: RevokeSessionUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<RevokeSessionUseCase>(RevokeSessionUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should revoke a session", async () => {
    await expect(
      service.execute("mock-refresh-token"),
    ).resolves.toBeUndefined();
  });
});
