import { AppException } from "@/common/exceptions/app-exception";
import { CreateSupplierUseCase } from "@/modules/suppliers/application/use-cases/create-supplier.use-case";

function build(overrides?: { byName?: unknown }) {
  const supplierRepository = {
    findByName: jest
      .fn()
      .mockResolvedValue(
        "byName" in (overrides ?? {}) ? overrides!.byName : null,
      ),
    create: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idSupplier: "s-1", ...payload }),
      ),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new CreateSupplierUseCase(
      supplierRepository as never,
      auth as never,
    ),
    supplierRepository,
    auth,
  };
}

const cmd = {
  idStore: "store-1",
  name: "  Atacadão  ",
  instagram: "@atacadao_oficial",
  email: "  contato@atacadao.com  ",
};

describe("CreateSupplierUseCase", () => {
  it("checks REGISTER_PURCHASE and creates the normalized supplier", async () => {
    const { useCase, supplierRepository, auth } = build();

    await useCase.execute("user-1", cmd);

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "REGISTER_PURCHASE",
    );
    expect(supplierRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Atacadão",
        instagram: "atacadao_oficial",
        email: "contato@atacadao.com",
        status: true,
      }),
    );
  });

  it("rejects a duplicated name", async () => {
    const { useCase } = build({ byName: { idSupplier: "other" } });
    await expect(useCase.execute("user-1", cmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects an empty name", async () => {
    const { useCase } = build();
    await expect(
      useCase.execute("user-1", { idStore: "store-1", name: "   " }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
