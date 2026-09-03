import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { GetUsersUseCase } from "../../application/use-cases/get/get-users.use-case";
import { userMock } from "../../__mocks__/user.mock";

describe("GetUsersUseCase", () => {
  let service: GetUsersUseCase;

  beforeAll(async () => {
    const serviceMock = {
      findAll: jest.fn().mockResolvedValue([userMock]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: GetUsersUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<GetUsersUseCase>(GetUsersUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return a list of users", async () => {
    const result = await service.findAll("user-id-test");
    expect(result).toEqual([userMock]);
  });

  it("should return empty array if no users", async () => {
    (service.findAll as jest.Mock).mockResolvedValueOnce([]);
    const result = await service.findAll("user-id-test");
    expect(result).toEqual([]);
  });
});
