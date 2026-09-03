import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { SaveSessionUseCase } from "../../application/use-cases/save/save-session.use-case";
import { sessionMock } from "../../__mocks__/session.mock";

describe("SaveSessionUseCase", () => {
  let service: SaveSessionUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn().mockResolvedValue(sessionMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: SaveSessionUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<SaveSessionUseCase>(SaveSessionUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should save a session", async () => {
    const result = await service.execute(sessionMock);
    expect(result).toEqual(sessionMock);
  });
});
