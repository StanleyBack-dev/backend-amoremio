import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { CreateSessionUseCase } from "../../application/use-cases/create/create-session.use-case";
import { sessionMock } from "../../__mocks__/session.mock";

describe("CreateSessionUseCase", () => {
  let service: CreateSessionUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn().mockResolvedValue(sessionMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: CreateSessionUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<CreateSessionUseCase>(CreateSessionUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a session", async () => {
    const result = await service.execute({
      idUsers: "mock-user-id",
      refreshToken: "mock-refresh-token",
    });

    expect(result).toEqual(sessionMock);
  });
});
