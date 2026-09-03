import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { ValidateSessionUseCase } from "../../application/use-cases/validate/validate-session.use-case";
import { sessionMock } from "../../__mocks__/session.mock";

describe("ValidateSessionUseCase", () => {
  let service: ValidateSessionUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn().mockResolvedValue(sessionMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: ValidateSessionUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<ValidateSessionUseCase>(ValidateSessionUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should validate active session", async () => {
    const result = await service.execute("mock-refresh-token", "mock-user-id");
    expect(result).toEqual(sessionMock);
  });

  it("should return null for invalid session", async () => {
    (service.execute as jest.Mock).mockResolvedValueOnce(null);

    const result = await service.execute("invalid-token", "mock-user-id");
    expect(result).toBeNull();
  });
});
