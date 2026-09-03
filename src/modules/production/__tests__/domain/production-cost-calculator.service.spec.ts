import { AppException } from "@/common/exceptions/app-exception";
import { ProductionCostCalculatorService } from "@/modules/production/domain/services/production-cost-calculator.service";

describe("ProductionCostCalculatorService", () => {
  it("spreads ingredient, labour and overhead cost over the actual output", () => {
    const result = ProductionCostCalculatorService.calculate({
      items: [
        { ref: "a", quantity: 0.5, unitCost: 10 }, // 5.00
        { ref: "b", quantity: 4, unitCost: 1.25 }, // 5.00
      ],
      laborCost: 6,
      overheadCost: 4,
      outputQuantity: 20,
    });

    expect(result.inputsCost).toBe(10);
    expect(result.totalCost).toBe(20);
    expect(result.outputUnitCost).toBe(1);
    expect(result.items).toEqual([
      { ref: "a", lineCost: 5 },
      { ref: "b", lineCost: 5 },
    ]);
  });

  it("raises the unit cost when the yield is lower than planned", () => {
    const full = ProductionCostCalculatorService.calculate({
      items: [{ ref: "a", quantity: 10, unitCost: 2 }],
      laborCost: 0,
      overheadCost: 0,
      outputQuantity: 20,
    });
    const short = ProductionCostCalculatorService.calculate({
      items: [{ ref: "a", quantity: 10, unitCost: 2 }],
      laborCost: 0,
      overheadCost: 0,
      outputQuantity: 16,
    });

    expect(full.outputUnitCost).toBe(1);
    expect(short.outputUnitCost).toBeGreaterThan(full.outputUnitCost);
  });

  it("rejects a non-positive output quantity", () => {
    expect(() =>
      ProductionCostCalculatorService.calculate({
        items: [{ ref: "a", quantity: 1, unitCost: 1 }],
        laborCost: 0,
        overheadCost: 0,
        outputQuantity: 0,
      }),
    ).toThrow(AppException);
  });
});
