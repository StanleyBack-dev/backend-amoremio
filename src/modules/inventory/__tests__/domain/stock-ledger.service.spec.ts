import { AppException } from "@/common/exceptions/app-exception";
import { UnitCost } from "@/shared/domain/value-objects/unit-cost.vo";
import { Quantity } from "@/shared/domain/value-objects/quantity.vo";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";
import { StockLedgerService } from "@/modules/inventory/domain/services/stock-ledger.service";

function state(qty: number, avg: number) {
  return {
    quantity: Quantity.fromNumber(qty),
    averageCost: UnitCost.fromNumber(avg),
  };
}

describe("StockLedgerService.apply", () => {
  it("recomputes the weighted average cost on an inbound movement", () => {
    // 10 un @ 2.00 + 10 un @ 4.00 => 20 un @ 3.00
    const result = StockLedgerService.apply(state(10, 2), {
      type: StockMovementType.ENTRADA_COMPRA,
      quantity: Quantity.fromNumber(10),
      unitCost: UnitCost.fromNumber(4),
    });

    expect(result.quantity.toNumber()).toBe(20);
    expect(result.averageCost.toNumber()).toBe(3);
  });

  it("uses the incoming cost as the average when starting from zero", () => {
    const result = StockLedgerService.apply(state(0, 0), {
      type: StockMovementType.ENTRADA_COMPRA,
      quantity: Quantity.fromNumber(5),
      unitCost: UnitCost.fromNumber(7.5),
    });

    expect(result.quantity.toNumber()).toBe(5);
    expect(result.averageCost.toNumber()).toBe(7.5);
  });

  it("reduces quantity and keeps the average on an outbound movement", () => {
    const result = StockLedgerService.apply(state(20, 3), {
      type: StockMovementType.SAIDA_VENDA,
      quantity: Quantity.fromNumber(8),
      unitCost: UnitCost.zero(),
    });

    expect(result.quantity.toNumber()).toBe(12);
    expect(result.averageCost.toNumber()).toBe(3);
  });

  it("rejects an outbound movement larger than the quantity on hand", () => {
    expect(() =>
      StockLedgerService.apply(state(5, 3), {
        type: StockMovementType.PERDA,
        quantity: Quantity.fromNumber(6),
        unitCost: UnitCost.zero(),
      }),
    ).toThrow(AppException);
  });

  it("rejects a zero-quantity movement", () => {
    expect(() =>
      StockLedgerService.apply(state(5, 3), {
        type: StockMovementType.AJUSTE_POSITIVO,
        quantity: Quantity.fromNumber(0),
        unitCost: UnitCost.fromNumber(3),
      }),
    ).toThrow(AppException);
  });

  it("handles fractional quantities without drift", () => {
    // 1.5 kg @ 10 + 0.25 kg @ 20 => 1.75 kg @ ~11.43
    const result = StockLedgerService.apply(state(1.5, 10), {
      type: StockMovementType.ENTRADA_COMPRA,
      quantity: Quantity.fromNumber(0.25),
      unitCost: UnitCost.fromNumber(20),
    });

    expect(result.quantity.toNumber()).toBe(1.75);
    expect(result.averageCost.toNumber()).toBeCloseTo(11.43, 2);
  });
});
