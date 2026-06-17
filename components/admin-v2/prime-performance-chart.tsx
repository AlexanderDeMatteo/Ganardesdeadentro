'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildYAxisDomain } from '@/lib/metrics-chart-utils';
import type { PerformanceChartPoint } from '@/lib/admin-v2/athlete-performance';

type PrimePerformanceChartProps = {
  title: string;
  data: PerformanceChartPoint[];
  unit: string;
  color?: string;
};

export function PrimePerformanceChart({
  title,
  data,
  unit,
  color = '#68ca62',
}: PrimePerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="gp-form-panel p-4">
        <p className="gp-label gp-text-phosphor mb-2">{title}</p>
        <p className="gp-mono text-sm gp-text-muted">Sin datos en este periodo.</p>
      </div>
    );
  }

  const yDomain = buildYAxisDomain(data.map((d) => d.value));

  return (
    <div className="gp-form-panel gp-reactor-chart p-4">
      <p className="gp-label gp-text-phosphor mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgb(63 74 60 / 0.35)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#899483' }} />
          <YAxis domain={yDomain} tick={{ fontSize: 10, fill: '#899483' }} unit={unit} />
          <Tooltip
            contentStyle={{
              background: '#151d19',
              border: '1px solid #3f4a3c',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 11,
            }}
            formatter={(value: number) => [`${value} ${unit}`, title]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
