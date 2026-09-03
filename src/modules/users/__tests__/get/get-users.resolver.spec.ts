import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { GetUsersUseCase } from "../../application/use-cases/get/get-users.use-case";
import { GetUsersResolver } from "../../presentation/graphql/resolvers/get/get-users.resolver";

describe("GetUsersResolver", () => {
  let resolver: GetUsersResolver;
  let useCase: GetUsersUseCase;

  beforeAll(async () => {
    const serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByIdOrFail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersResolver,
        { provide: GetUsersUseCase, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<GetUsersResolver>(GetUsersResolver);
    useCase = module.get<GetUsersUseCase>(GetUsersUseCase);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
    expect(useCase).toBeDefined();
  });
});
