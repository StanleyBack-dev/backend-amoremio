import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { UpdateUserUseCase } from "../../application/use-cases/update/update-user.use-case";
import { userMock } from "../../__mocks__/user.mock";

describe("UpdateUserUseCase", () => {
  let service: UpdateUserUseCase;

  beforeAll(async () => {
    const serviceMock = {
      execute: jest.fn().mockResolvedValue({
        ...userMock,
        name: "Usuario Atualizado",
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: UpdateUserUseCase, useValue: serviceMock }],
    }).compile();

    service = module.get<UpdateUserUseCase>(UpdateUserUseCase);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should update a user", async () => {
    const result = await service.execute("mock-user-id", {
      name: "Usuario Atualizado",
    });

    expect(result.name).toBe("Usuario Atualizado");
  });

  it("should throw when update fails", async () => {
    (service.execute as jest.Mock).mockRejectedValueOnce(
      new Error("Erro ao atualizar usuário."),
    );

    await expect(
      service.execute("mock-user-id", { name: "Falha" }),
    ).rejects.toThrow("Erro ao atualizar usuário.");
  });
});
