'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMetrics } from '@/hooks/use-metrics';

const axisStroke = '#6b7280';
const gridStroke = '#374151';
const tooltipBg = '#1a1d1f';
const tooltipBorder = '#3f4449';

export function FitnessDashboardBodyProgressChart() {
  const { entries, isLoading } = useMetrics();

  const data = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({
        label: new Date(e.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        weight: e.weight,
        bodyFat: e.bodyFat,
        muscleMass: e.muscleMass,
      }))
      .filter((d) => d.weight != null || d.bodyFat != null || d.muscleMass != null);
  }, [entries]);

  if (isLoading) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center text-sm text-[#6b7280]">
        Cargando métricas…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center text-sm text-[#6b7280]">
        Añade mediciones en Métricas para ver tu progreso.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.6} />
          <XAxis dataKey="label" stroke={axisStroke} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis
            yAxisId="kg"
            stroke={axisStroke}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            domain={['auto', 'auto']}
            label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            stroke={axisStroke}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            domain={['auto', 'auto']}
            label={{ value: '% grasa', angle: 90, position: 'insideRight', fill: '#9ca3af', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              color: '#fafafa',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#d1d5db' }} />
          <Line
            yAxisId="kg"
            type="monotone"
            dataKey="weight"
            name="Peso (kg)"
            stroke="#a3e635"
            strokeWidth={2}
            dot={{ fill: '#a3e635', r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="bodyFat"
            name="Grasa corporal (%)"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 3 }}
            connectNulls
          />
          <Line
            yAxisId="kg"
            type="monotone"
            dataKey="muscleMass"
            name="Masa muscular (kg)"
            stroke="#d1d5db"
            strokeWidth={2}
            dot={{ fill: '#d1d5db', r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
