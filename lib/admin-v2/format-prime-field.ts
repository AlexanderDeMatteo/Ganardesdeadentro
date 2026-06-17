export function formatPrimeField(
  value: number | string | null | undefined,
  unit?: string,
  fallback = '—',
): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'number' && value <= 0) return fallback;
  return unit ? `${value} ${unit}` : String(value);
}

export function formatPrimeAge(value: number | null | undefined): string {
  if (value == null || value <= 0) return '—';
  return String(value);
}

export function formatPrimeAgeDetail(value: number | null | undefined): string {
  if (value == null || value <= 0) return 'No indicada';
  return `${value} años`;
}

export function formatLatestMetric(
  metrics: { weight: number; bodyFat: number } | null | undefined,
): string {
  if (!metrics || metrics.weight <= 0) return '—';
  const bodyFat =
    metrics.bodyFat != null && metrics.bodyFat > 0 ? ` · ${metrics.bodyFat}%` : '';
  return `${metrics.weight} kg${bodyFat}`;
}
