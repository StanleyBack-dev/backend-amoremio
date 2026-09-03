import { AppException } from "@/common/exceptions/app-exception";
import { SalesOrderCalculatorService } from "@/modules/sales/domain/services/sales-order-calculator.service";

describe("SalesOrderCalculatorService.calculate", () => {
  it("computes line totals, subtotal and total with a flat discount", () => {
    const result = SalesOrderCalculatorService.calculate(
      [
        { ref: "a", quantity: 2, unitPrice: 10 },
        { ref: "b", quantity: 1, unitPrice: 30 },
      ],
      5,
    );

    expect(result.itemsSubtotal).toBe(50);
    expect(result.discountAmount).toBe(5);
    expect(result.total).toBe(45);
    expect(result.lines).toEqual([
      { ref: "a", lineTotal: 20 },
      { ref: "b", lineTotal: 30 },
    ]);
  });

  it("takes the platform commission off the total for the net amount", () => {
    const result = SalesOrderCalculatorService.calculate(
      [{ ref: "a", quantity: 1, unitPrice: 100 }],
      0,
      12,
    );

    expect(result.total).toBe(100);
    expect(result.commissionPercent).toBe(12);
    expect(result.commissionAmount).toBe(12);
    expect(result.netTotal).toBe(88);
  });

  it("defaults commission to zero", () => {
    const result = SalesOrderCalculatorService.calculate(
      [{ ref: "a", quantity: 1, unitPrice: 100 }],
      0,
    );
    expect(result.commissionAmount).toBe(0);
    expect(result.netTotal).toBe(100);
  });

  it("rejects a discount greater than the subtotal", () => {
    expect(() =>
      SalesOrderCalculatorService.calculate(
        [{ ref: "a", quantity: 1, unitPrice: 10 }],
        15,
      ),
    ).toThrow(AppException);
  });

  it("rejects a non-positive quantity", () => {
    expect(() =>
      SalesOrderCalculatorService.calculate(
        [{ ref: "a", quantity: 0, unitPrice: 10 }],
        0,
      ),
    ).toThrow(AppException);
  });
});
