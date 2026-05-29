export type ChartPoint = {
  date: string;
  value: number | undefined;
};

export function filterOutliersByRollingAverage(
  points: ChartPoint[],
  opts?: { windowSize?: number; maxDeviationRatio?: number; minHistory?: number },
): { points: ChartPoint[]; hiddenCount: number } {
  const windowSize = opts?.windowSize ?? 5;
  const maxDeviationRatio = opts?.maxDeviationRatio ?? 0.3;
  const minHistory = opts?.minHistory ?? 3;

  const accepted: number[] = [];
  const filtered: ChartPoint[] = [];
  let hiddenCount = 0;

  for (const point of points) {
    const current = point.value;
    if (typeof current !== 'number') {
      filtered.push(point);
      continue;
    }

    const history = accepted.slice(-windowSize);
    if (history.length < minHistory) {
      accepted.push(current);
      filtered.push(point);
      continue;
    }

    const avg = history.reduce((sum, v) => sum + v, 0) / history.length;
    const allowedDelta = Math.abs(avg) * maxDeviationRatio;
    const isOutlier = Math.abs(current - avg) > allowedDelta;

    if (isOutlier) {
      hiddenCount += 1;
      filtered.push({ ...point, value: undefined });
      continue;
    }

    accepted.push(current);
    filtered.push(point);
  }

  return { points: filtered, hiddenCount };
}

export function buildYAxisDomain(
  values: Array<number | undefined>,
  paddingRatio = 0.1,
): [number, number] | ['auto', 'auto'] {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length < 2) return ['auto', 'auto'];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = Math.max(1, max - min);
  const pad = span * paddingRatio;
  return [Math.max(0, min - pad), max + pad];
}
