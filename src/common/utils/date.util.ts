const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

const saoPauloDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * "Today" as a UTC-midnight Date for the America/Sao_Paulo calendar day.
 *
 * `new Date()` is a full instant; when the store's local time is late evening
 * the UTC calendar day is already tomorrow, and `dateOnlyTransformer` /
 * `toDateOnlyString` (which read UTC getters) would then store a `date`
 * column one day ahead. Defaulting date-only fields (orderDate, purchaseDate,
 * productionDate) to this value keeps them on the real local day.
 */
export function currentDateOnly(reference: Date = new Date()): Date {
  // en-CA formats as "YYYY-MM-DD".
  const localDate = saoPauloDateFormatter.format(reference);
  return new Date(`${localDate}T00:00:00.000Z`);
}

const saoPauloFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Formats a Date as a naive "YYYY-MM-DDTHH:mm:ss" string in America/Sao_Paulo
 * wall-clock time, with no UTC/offset suffix. Used for fields that must
 * display the real local time as-is, without any timezone conversion on read.
 */
/**
 * Extracts the "YYYY-MM-DD" calendar date from a Date that is UTC-midnight
 * aligned (as produced by GraphQL's DateTime scalar parsing a date-only
 * input string). Meant for binding `date`-only query parameters directly as
 * a string, bypassing `pg`'s default Date serialization — which reads LOCAL
 * time components and would silently shift the day on any server running
 * behind UTC (see date-only.transformer.ts for the full write-path bug).
 */
export function toDateOnlyString(date?: Date | null): string | undefined {
  if (!date) {
    return undefined;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalNaiveIsoString(date?: Date | null): string | undefined {
  if (!date) {
    return undefined;
  }

  const parts = saoPauloFormatter
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}
