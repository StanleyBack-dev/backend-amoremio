function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

export function formatLocalDateTime(value?: Date): string | undefined {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined;
  }

  const year = value.getUTCFullYear();
  const month = pad(value.getUTCMonth() + 1);
  const day = pad(value.getUTCDate());
  const hour = pad(value.getUTCHours());
  const minute = pad(value.getUTCMinutes());
  const second = pad(value.getUTCSeconds());
  const milliseconds = pad(value.getUTCMilliseconds(), 3);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}`;
}
