/** Fecha local YYYY-MM-DD. */
export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLast7DateKeys(end: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    keys.push(toLocalDateKey(d));
  }
  return keys;
}

export function formatDateKeyShort(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
}

function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysToDateKey(dateKey: string, delta: number): string {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + delta);
  return toLocalDateKey(date);
}

export function isDateKeyOnOrBeforeToday(dateKey: string): boolean {
  return dateFromKey(dateKey).getTime() <= dateFromKey(toLocalDateKey()).getTime();
}

export function clampDateKeyToLast7Days(dateKey: string): string {
  const keys = getLast7DateKeys();
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return toLocalDateKey();
  if (dateFromKey(dateKey).getTime() < dateFromKey(first).getTime()) return first;
  if (dateFromKey(dateKey).getTime() > dateFromKey(last).getTime()) return last;
  return dateKey;
}
