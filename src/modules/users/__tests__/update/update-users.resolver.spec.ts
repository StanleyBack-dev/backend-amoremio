import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { UpdateUserUseCase } from "../../application/use-cases/update/update-user.use-case";
import { UpdateUserResolver } from "../../presentation/graphql/resolvers/update/update-users.resolver";

describe("UpdateUserResolver", () => {
  let resolver: UpdateUserResolver;
  let useCase: UpdateUserUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserResolver,
        { provide: UpdateUserUseCase, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<UpdateUserResolver>(UpdateUserResolver);
    useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
    expect(useCase).toBeDefined();
  });
});
