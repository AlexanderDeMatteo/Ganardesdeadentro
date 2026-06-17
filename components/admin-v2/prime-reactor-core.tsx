'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PrimeSegmentRing } from '@/components/admin-v2/prime-segment-ring';
import { PrimeModule } from '@/components/admin-v2/prime-module';

export type SparklinePoint = {
  day: string;
  rate: number;
};

type PrimeReactorCoreProps = {
  assignmentRate: number;
  athletesWithoutTrainer: number;
  sparklineSeries: SparklinePoint[];
};

type TooltipPayload = {
  payload?: SparklinePoint;
};

function ReactorTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="gp-reactor-tooltip gp-module-corner">
      <p className="gp-metric text-[#becab8]">{label ?? point.day}</p>
      <p className="gp-metric mt-1 text-[#83e77b]">{point.rate}%</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#899483]">
        estimación 7d
      </p>
    </div>
  );
}

export function PrimeReactorCore({
  assignmentRate,
  athletesWithoutTrainer,
  sparklineSeries,
}: PrimeReactorCoreProps) {
  const rawId = useId().replace(/:/g, '');
  const gradId = `reactor-spark-${rawId}`;

  return (
    <PrimeModule modId="07" title="COBERTURA_ASIGNACIÓN" variant="reactor" className="gp-phosphor-glow">
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
        <div
          className="relative mx-auto flex shrink-0 items-center justify-center"
          aria-label={`Tasa de asignación ${assignmentRate} por ciento`}
        >
          <PrimeSegmentRing value={assignmentRate} size={200} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="gp-display text-xs uppercase tracking-widest text-[#83e77b]">
              REACTOR
            </span>
            <span className="gp-metric mt-1 text-4xl font-bold text-[#dce5de]">
              {assignmentRate}%
            </span>
            {athletesWithoutTrainer > 0 ? (
              <span className="gp-metric mt-2 text-xs text-[#ffb4ab]">
                {athletesWithoutTrainer} críticos
              </span>
            ) : (
              <span className="gp-metric mt-2 text-xs text-[#83e77b]">óptimo</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="gp-mono mb-3 text-xs uppercase text-[#becab8]">
            Tendencia asignación — estimación 7d
          </p>
          <div className="gp-reactor-chart h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#68ca62" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#68ca62" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#899483', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#899483', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={<ReactorTooltip />}
                  cursor={{ stroke: '#68ca62', strokeOpacity: 0.35 }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#83e77b"
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PrimeModule>
  );
}
