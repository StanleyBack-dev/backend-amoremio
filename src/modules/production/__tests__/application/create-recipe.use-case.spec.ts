import { AppException } from "@/common/exceptions/app-exception";
import { RecipeCrudUseCases } from "@/modules/production/application/use-cases/recipe-crud.use-cases";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

function build(overrides?: {
  outputProduct?: unknown;
  inputProduct?: unknown;
  recipeByOutput?: Record<string, unknown>;
  recipeItems?: Array<{ idProduct: string }>;
}) {
  const recipeByOutput = overrides?.recipeByOutput ?? {};
  const recipeRepository = {
    findRecipeByOutputProduct: jest
      .fn()
      .mockImplementation((_store: string, id: string) =>
        Promise.resolve(recipeByOutput[id] ?? null),
      ),
    findRecipeById: jest
      .fn()
      .mockResolvedValue({
        idRecipe: "rec-1",
        idOutputProduct: "out-1",
        items: overrides?.recipeItems ?? [],
      }),
    createRecipe: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idRecipe: "rec-1", items: [], ...payload }),
      ),
    addRecipeItem: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ idRecipe: "rec-1", items: [] }),
      ),
    addRecipeItems: jest
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ idRecipe: "rec-1", items: payload.items }),
      ),
  };
  const productRepository = {
    findById: jest.fn().mockImplementation((_store: string, id: string) => {
      if (id === "out-1") {
        return Promise.resolve(
          overrides && "outputProduct" in overrides
            ? overrides.outputProduct
            : {
                idProduct: "out-1",
                name: "Brownie",
                kind: ProductKind.PRODUTO_FINAL,
                unit: UnitOfMeasure.UN,
              },
        );
      }
      if (id === "in-1") {
        return Promise.resolve(
          overrides && "inputProduct" in overrides
            ? overrides.inputProduct
            : {
                idProduct: "in-1",
                name: "Farinha",
                kind: ProductKind.INSUMO,
                unit: UnitOfMeasure.KG,
              },
        );
      }
      if (id === "in-2") {
        return Promise.resolve({
          idProduct: "in-2",
          name: "Açúcar",
          kind: ProductKind.INSUMO,
          unit: UnitOfMeasure.KG,
        });
      }
      return Promise.resolve(null);
    }),
    findManyByIds: jest.fn(),
  };
  productRepository.findManyByIds.mockImplementation(
    async (_store: string, ids: string[]) => {
      const found = await Promise.all(
        ids.map((id) => productRepository.findById(_store, id)),
      );
      return found.filter((product) => product != null);
    },
  );
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useCase: new RecipeCrudUseCases(
      recipeRepository as never,
      productRepository as never,
      auth as never,
    ),
    recipeRepository,
    productRepository,
    auth,
  };
}

const createCmd = {
  idStore: "store-1",
  idOutputProduct: "out-1",
  yieldQuantity: 20,
};

describe("RecipeCrudUseCases.create", () => {
  it("creates a recipe for a finished good and snapshots its unit", async () => {
    const { useCase, recipeRepository, auth } = build();

    await useCase.create("user-1", createCmd);

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "user-1",
      "store-1",
      "MANAGE_RECIPES",
    );
    expect(recipeRepository.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        idOutputProduct: "out-1",
        name: "Brownie",
        yieldQuantity: 20,
        yieldUnit: "UN",
      }),
    );
  });

  it("accepts an intermediate product as the recipe output", async () => {
    const { useCase, recipeRepository } = build({
      outputProduct: {
        idProduct: "out-1",
        name: "Massa base",
        kind: ProductKind.INTERMEDIARIO,
        unit: UnitOfMeasure.KG,
      },
    });

    await useCase.create("user-1", createCmd);

    expect(recipeRepository.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Massa base", yieldUnit: "KG" }),
    );
  });

  it("rejects an output product that is neither finished good nor intermediate", async () => {
    const { useCase } = build({
      outputProduct: {
        idProduct: "out-1",
        name: "Farinha",
        kind: ProductKind.INSUMO,
        unit: UnitOfMeasure.KG,
      },
    });
    await expect(useCase.create("user-1", createCmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects a duplicated recipe for the same product", async () => {
    const { useCase } = build({
      recipeByOutput: { "out-1": { idRecipe: "other" } },
    });
    await expect(useCase.create("user-1", createCmd)).rejects.toBeInstanceOf(
      AppException,
    );
  });
});

describe("RecipeCrudUseCases.addItem", () => {
  it("adds an insumo ingredient and snapshots its stock unit", async () => {
    const { useCase, recipeRepository } = build();

    await useCase.addItem("user-1", {
      idStore: "store-1",
      idRecipe: "rec-1",
      idProduct: "in-1",
      quantity: 0.5,
    });

    expect(recipeRepository.addRecipeItem).toHaveBeenCalledWith(
      expect.objectContaining({ idProduct: "in-1", quantity: 0.5, unit: "KG" }),
    );
  });

  it("rejects an ingredient that is neither insumo nor intermediate", async () => {
    const { useCase } = build({
      inputProduct: {
        idProduct: "in-1",
        name: "Brownie",
        kind: ProductKind.PRODUTO_FINAL,
        unit: UnitOfMeasure.UN,
      },
    });
    await expect(
      useCase.addItem("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        idProduct: "in-1",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects an intermediate ingredient that would form a cycle", async () => {
    // recipe output is "out-1"; the intermediate "in-1" has a recipe that
    // consumes "out-1" -> adding "in-1" here would loop.
    const { useCase } = build({
      inputProduct: {
        idProduct: "in-1",
        name: "Sub-massa",
        kind: ProductKind.INTERMEDIARIO,
        unit: UnitOfMeasure.KG,
      },
      recipeByOutput: {
        "in-1": { idRecipe: "r-sub", items: [{ idProduct: "out-1" }] },
      },
    });

    await expect(
      useCase.addItem("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        idProduct: "in-1",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("allows an intermediate ingredient with no cyclic dependency", async () => {
    const { useCase, recipeRepository } = build({
      inputProduct: {
        idProduct: "in-1",
        name: "Massa base",
        kind: ProductKind.INTERMEDIARIO,
        unit: UnitOfMeasure.KG,
      },
      recipeByOutput: {
        "in-1": { idRecipe: "r-base", items: [{ idProduct: "flour" }] },
      },
    });

    await useCase.addItem("user-1", {
      idStore: "store-1",
      idRecipe: "rec-1",
      idProduct: "in-1",
      quantity: 2,
    });

    expect(recipeRepository.addRecipeItem).toHaveBeenCalledWith(
      expect.objectContaining({ idProduct: "in-1", quantity: 2 }),
    );
  });
});

describe("RecipeCrudUseCases.addItems", () => {
  it("validates every entry and saves the batch in one call", async () => {
    const { useCase, recipeRepository } = build();

    await useCase.addItems("user-1", {
      idStore: "store-1",
      idRecipe: "rec-1",
      items: [
        { idProduct: "in-1", quantity: 0.5 },
        { idProduct: "in-2", quantity: 1.25 },
      ],
    });

    expect(recipeRepository.addRecipeItem).not.toHaveBeenCalled();
    expect(recipeRepository.addRecipeItems).toHaveBeenCalledWith(
      expect.objectContaining({
        idRecipe: "rec-1",
        items: [
          expect.objectContaining({ idProduct: "in-1", quantity: 0.5, unit: "KG" }),
          expect.objectContaining({ idProduct: "in-2", quantity: 1.25, unit: "KG" }),
        ],
      }),
    );
  });

  it("rejects a batch that repeats the same product", async () => {
    const { useCase, recipeRepository } = build();
    await expect(
      useCase.addItems("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        items: [
          { idProduct: "in-1", quantity: 0.5 },
          { idProduct: "in-1", quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(recipeRepository.addRecipeItems).not.toHaveBeenCalled();
  });

  it("rejects a product already on the recipe", async () => {
    const { useCase, recipeRepository } = build({
      recipeItems: [{ idProduct: "in-1" }],
    });
    await expect(
      useCase.addItems("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        items: [{ idProduct: "in-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(recipeRepository.addRecipeItems).not.toHaveBeenCalled();
  });

  it("rejects an empty batch", async () => {
    const { useCase } = build();
    await expect(
      useCase.addItems("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        items: [],
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects the whole batch when one entry is invalid", async () => {
    const { useCase, recipeRepository } = build({
      inputProduct: {
        idProduct: "in-1",
        name: "Brownie",
        kind: ProductKind.PRODUTO_FINAL,
        unit: UnitOfMeasure.UN,
      },
    });

    await expect(
      useCase.addItems("user-1", {
        idStore: "store-1",
        idRecipe: "rec-1",
        items: [{ idProduct: "in-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(recipeRepository.addRecipeItems).not.toHaveBeenCalled();
  });
});
