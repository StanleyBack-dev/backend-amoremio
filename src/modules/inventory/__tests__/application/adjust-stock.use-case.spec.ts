import { AppException } from "@/common/exceptions/app-exception";
import { AdjustStockUseCase } from "@/modules/inventory/application/use-cases/adjust-stock.use-case";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

function build() {
  const auth = {
    assertStorePermission: jest.fn().mockResolvedValue(undefined),
  };
  const ledger = { registerMovement: jest.fn().mockResolvedValue(undefined) };
  return {
    useCase: new AdjustStockUseCase(auth as never, ledger as never),
    auth,
    ledger,
  };
}

describe("AdjustStockUseCase", () => {
  it("requires ADJUST_INVENTORY and forwards the movement", async () => {
    const { useCase, auth, ledger } = build();

    await useCase.execute("u-1", {
      idStore: "s-1",
      idProduct: "p-1",
      type: StockMovementType.PERDA,
      quantity: 3,
      note: "quebrou",
    });

    expect(auth.assertStorePermission).toHaveBeenCalledWith(
      "u-1",
      "s-1",
      "ADJUST_INVENTORY",
    );
    expect(ledger.registerMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: StockMovementType.PERDA,
        quantity: 3,
        sourceType: "MANUAL_ADJUSTMENT",
        note: "quebrou",
      }),
    );
  });

  it("rejects a non-adjustment movement type", async () => {
    const { useCase, ledger } = build();

    await expect(
      useCase.execute("u-1", {
        idStore: "s-1",
        idProduct: "p-1",
        type: StockMovementType.ENTRADA_COMPRA as never,
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(ledger.registerMovement).not.toHaveBeenCalled();
  });
});
