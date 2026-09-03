import { AppException } from "@/common/exceptions/app-exception";
import { CreateBrandUseCase } from "@/modules/brands/application/use-cases/create-brand.use-case";

function build(overrides?: { byName?: unknown }) {
  const brandRepository = {
    findByName: jest
      .fn()
      .mockResolvedValue(
        "byName" in (overrides ?? {}) ? overrides!.byName : null,
      ),
    create: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idBrand: "b-1", ...payload }),
      ),
  };
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new CreateBrandUseCase(brandRepository as never, auth as never),
    brandRepository,
    auth,
  };
}

const cmd = { idStore: "store-1", name: "  Nestlé  " };

describe("CreateBrandUseCase", () => {
  it("checks the store permission and creates the trimmed brand", async () => {
    const { useCase, brandRepository, auth } = build();

    await useCase.execute("user-1", cmd);

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "MANAGE_PRODUCTS",
    );
    expect(brandRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nestlé", status: true }),
    );
  });

  it("rejects a duplicated name", async () => {
    const { useCase } = build({ byName: { idBrand: "other" } });
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
