import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { CreateUserUseCase } from "../../application/use-cases/create/create-user.use-case";
import { CreateUserResolver } from "../../presentation/graphql/resolvers/create/create-user.resolver";

describe("CreateUserResolver", () => {
  let resolver: CreateUserResolver;
  let useCase: CreateUserUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserResolver,
        { provide: CreateUserUseCase, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<CreateUserResolver>(CreateUserResolver);
    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
    expect(useCase).toBeDefined();
  });
});
