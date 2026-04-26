export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function nowIso(): string {
  return new Date("2026-04-25T12:00:00.000Z").toISOString();
}

export function normalizeMoney(value: string): string {
  return value
    .replace(/\s/g, "")
    .replace("€", "EUR")
    .replace(",", ".")
    .toUpperCase();
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

