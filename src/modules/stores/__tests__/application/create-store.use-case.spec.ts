import { AppException } from "@/common/exceptions/app-exception";
import { CreateStoreUseCase } from "@/modules/stores/application/use-cases/create/create-store.use-case";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

function build() {
  const storeRepository = {
    create: jest.fn().mockImplementation((payload) =>
      Promise.resolve({
        idStore: "store-1",
        name: payload.name,
        legalName: payload.legalName ?? null,
        cnpj: payload.cnpj ?? null,
        status: true,
        createdByUserId: payload.createdByUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
  };

  const useCase = new CreateStoreUseCase(storeRepository as never);
  return { useCase, storeRepository };
}

describe("CreateStoreUseCase", () => {
  it("creates the store with the caller as owner and returns the DONO role", async () => {
    const { useCase, storeRepository } = build();

    const result = await useCase.execute("user-1", {
      name: "  Amore Mio  ",
      cnpj: "12.345.678/0001-99",
    });

    expect(storeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Amore Mio",
        cnpj: "12345678000199",
        createdByUserId: "user-1",
        ownerUserId: "user-1",
      }),
    );
    expect(result.role).toBe(StoreRole.DONO);
  });

  it("rejects an invalid store name", async () => {
    const { useCase } = build();

    await expect(useCase.execute("user-1", { name: "  " })).rejects.toBeInstanceOf(
      AppException,
    );
  });
});
