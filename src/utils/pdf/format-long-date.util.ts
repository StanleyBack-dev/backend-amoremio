const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

// Represents a real instant (e.g. "now"), so it must read the Brazil
// wall-clock calendar day explicitly rather than the ambient server
// timezone (which is UTC on Vercel) — see format-date.util.ts for the
// analogous fix on UTC-midnight-aligned date-only values.
const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SAO_PAULO_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

function parsePdfDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  }

  return new Date(value);
}

export function formatLongDateBR(value: string | Date): string {
  return LONG_DATE_FORMATTER.format(parsePdfDate(value));
}
