import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

// A non-negative amount of a product, kept at 3 decimals so fractional
// units (0.250 kg, 1.5 L) survive arithmetic without drift. Internally
// stored as thousandths to keep add/subtract exact.
const SCALE = 1000;

export class Quantity {
  private constructor(private readonly milli: number) {}

  static fromNumber(value: number): Quantity {
    if (!Number.isFinite(value) || value < 0) {
      throw AppException.from(APP_ERRORS.shared.invalidQuantity, undefined);
    }
    return new Quantity(Math.round(value * SCALE));
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.milli + other.milli);
  }

  // Throws when the result would be negative — the caller must handle
  // "not enough stock" explicitly rather than silently going below zero.
  subtract(other: Quantity): Quantity {
    const result = this.milli - other.milli;
    if (result < 0) {
      throw AppException.from(APP_ERRORS.shared.negativeQuantity, undefined);
    }
    return new Quantity(result);
  }

  isZero(): boolean {
    return this.milli === 0;
  }

  isLessThan(other: Quantity): boolean {
    return this.milli < other.milli;
  }

  toNumber(): number {
    return this.milli / SCALE;
  }
}
