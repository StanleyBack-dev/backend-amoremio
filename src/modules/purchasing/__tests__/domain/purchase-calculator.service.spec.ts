import { AppException } from "@/common/exceptions/app-exception";
import { PurchaseCalculatorService } from "@/modules/purchasing/domain/services/purchase-calculator.service";

describe("PurchaseCalculatorService.calculate", () => {
  it("computes line totals, base quantities and effective unit cost with unit conversion", () => {
    // 3 fardos @ R$ 24, 1 fardo = 12 unidades => 36 un, R$ 72 / 36 = R$ 2,00
    const result = PurchaseCalculatorService.calculate({
      items: [
        {
          ref: "a",
          purchasedQuantity: 3,
          conversionFactor: 12,
          unitPrice: 24,
        },
      ],
      freightAmount: 0,
      discountAmount: 0,
    });

    expect(result.itemsSubtotal).toBe(72);
    expect(result.total).toBe(72);
    expect(result.items[0]).toMatchObject({
      lineTotal: 72,
      baseQuantity: 36,
      effectiveUnitCost: 2,
    });
  });

  it("apportions freight across lines by weight and the last line absorbs the remainder", () => {
    const result = PurchaseCalculatorService.calculate({
      items: [
        { ref: "a", purchasedQuantity: 1, conversionFactor: 1, unitPrice: 30 },
        { ref: "b", purchasedQuantity: 1, conversionFactor: 1, unitPrice: 70 },
      ],
      freightAmount: 10,
      discountAmount: 0,
    });

    expect(result.total).toBe(110);
    // 30% / 70% split of R$ 10 freight
    expect(result.items[0].apportionedAdjustment).toBe(3);
    expect(result.items[1].apportionedAdjustment).toBe(7);
    expect(result.items[0].effectiveUnitCost).toBe(33);
    expect(result.items[1].effectiveUnitCost).toBe(77);
    const sum =
      result.items[0].apportionedAdjustment +
      result.items[1].apportionedAdjustment;
    expect(sum).toBe(10);
  });

  it("subtracts an apportioned discount", () => {
    const result = PurchaseCalculatorService.calculate({
      items: [
        { ref: "a", purchasedQuantity: 2, conversionFactor: 1, unitPrice: 50 },
      ],
      freightAmount: 0,
      discountAmount: 20,
    });

    expect(result.total).toBe(80);
    expect(result.items[0].effectiveLineCost).toBe(80);
    expect(result.items[0].effectiveUnitCost).toBe(40);
  });

  it("rejects a discount larger than subtotal + freight", () => {
    expect(() =>
      PurchaseCalculatorService.calculate({
        items: [
          {
            ref: "a",
            purchasedQuantity: 1,
            conversionFactor: 1,
            unitPrice: 10,
          },
        ],
        freightAmount: 0,
        discountAmount: 15,
      }),
    ).toThrow(AppException);
  });

  it("rejects invalid item inputs", () => {
    expect(() =>
      PurchaseCalculatorService.calculate({
        items: [
          {
            ref: "a",
            purchasedQuantity: 0,
            conversionFactor: 1,
            unitPrice: 10,
          },
        ],
        freightAmount: 0,
        discountAmount: 0,
      }),
    ).toThrow(AppException);

    expect(() =>
      PurchaseCalculatorService.calculate({
        items: [
          {
            ref: "a",
            purchasedQuantity: 1,
            conversionFactor: 0,
            unitPrice: 10,
          },
        ],
        freightAmount: 0,
        discountAmount: 0,
      }),
    ).toThrow(AppException);
  });
});
