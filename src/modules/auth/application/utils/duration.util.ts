import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/i;

const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(value: string): number {
  if (/^\d+$/.test(value)) {
    return Number(value) * 1000;
  }

  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw AppException.from(APP_ERRORS.validation.invalidFormat as any, {
      value,
    });
  }

  const [, amount, unit] = match;
  return Number(amount) * DURATION_MULTIPLIERS[unit.toLowerCase()];
}
