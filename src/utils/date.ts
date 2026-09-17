export function toIsoOrUndefined(value: Date | string): string | undefined {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
