import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

// Monetary amount in BRL, always rounded to 2 decimals. Non-negative:
// prices, costs and totals in this domain are never negative (a refund or
// write-off is modeled as a separate movement, not a negative amount).
export class Money {
  private constructor(private readonly cents: number) {}

  static fromNumber(value: number): Money {
    if (!Number.isFinite(value) || value < 0) {
      throw AppException.from(APP_ERRORS.shared.invalidMoney, undefined);
    }
    return new Money(Math.round(value * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw AppException.from(APP_ERRORS.shared.invalidMoney, undefined);
    }
    return new Money(Math.round(this.cents * factor));
  }

  toNumber(): number {
    return this.cents / 100;
  }

  isZero(): boolean {
    return this.cents === 0;
  }
}
