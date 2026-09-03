/**
 * Date-only DB columns (`dateOnlyTransformer`) always come back as a
 * UTC-midnight-aligned Date. Formatting that through `Intl.DateTimeFormat`
 * without an explicit `timeZone` reads the *ambient* server timezone (e.g.
 * UTC on Vercel), which can roll the calendar day backwards for any server
 * running behind UTC. Reading the UTC getters directly sidesteps that
 * entirely — see date-only.transformer.ts for the same reasoning on write.
 */
function toDateParts(value: string | Date): {
  year: number;
  month: number;
  day: number;
} {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }

    return toDateParts(new Date(value));
  }

  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

export function formatDateBR(value: string | Date): string {
  const { year, month, day } = toDateParts(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
