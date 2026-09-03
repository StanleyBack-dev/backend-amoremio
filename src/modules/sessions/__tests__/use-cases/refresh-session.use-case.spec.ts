import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { RefreshSessionUseCase } from "../../application/use-cases/refresh/refresh-session.use-case";
import { SaveSessionUseCase } from "../../application/use-cases/save/save-session.use-case";
import { sessionMock } from "../../__mocks__/session.mock";

describe("RefreshSessionUseCase", () => {
  let service: RefreshSessionUseCase;
  let saveSessionUseCase: SaveSessionUseCase;

  beforeAll(async () => {
    const saveSessionUseCaseMock = {
      execute: jest.fn().mockResolvedValue(sessionMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        { provide: SaveSessionUseCase, useValue: saveSessionUseCaseMock },
      ],
    }).compile();

    service = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);
    saveSessionUseCase = module.get<SaveSessionUseCase>(SaveSessionUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(saveSessionUseCase).toBeDefined();
  });

  it("should refresh a valid session", async () => {
    await service.execute({
      ...sessionMock,
      refreshTokenExpiresAt: new Date("2099-12-31T00:00:00Z"),
    });

    expect(saveSessionUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("should throw when session is expired", async () => {
    await expect(
      service.execute({
        ...sessionMock,
        refreshTokenExpiresAt: new Date("2000-01-01T00:00:00Z"),
      }),
    ).rejects.toThrow();
  });
});
