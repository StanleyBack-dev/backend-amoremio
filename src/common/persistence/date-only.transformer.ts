import type { ValueTransformer } from "typeorm";

/**
 * Postgres `date` (no time component) columns come back from the driver as
 * a plain "YYYY-MM-DD" string, not a JS Date instance. GraphQL's DateTime
 * scalar only serializes actual Date objects (anything else silently
 * becomes null, which then fails non-nullable field validation), so every
 * date-only column must convert on the way out of the database.
 *
 * On the way IN, GraphQL's DateTime scalar parses a date-only input string
 * (e.g. "2026-08-09") as UTC midnight. The `pg` driver's default Date
 * serialization reads LOCAL date/time components (not UTC) to build the
 * outbound value, so on any server running behind UTC (e.g.
 * America/Sao_Paulo) that UTC-midnight instant lands on the previous local
 * day, and the `date` column silently stores the wrong calendar day. Since
 * the incoming Date is always UTC-midnight-aligned for these fields,
 * extracting the calendar date via UTC getters and handing pg a plain
 * string (which it passes through untouched) sidesteps that local-time
 * conversion entirely.
 */
export const dateOnlyTransformer: ValueTransformer = {
  to: (value?: Date | null) => {
    if (!value) return value;

    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },
  from: (value?: string | null) => (value ? new Date(value) : value),
};
