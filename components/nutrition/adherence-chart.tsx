'use client';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useNutrition } from '@/hooks/use-nutrition';
import { formatAdherenceDeviation } from '@/lib/nutrition/adherence';
import { useState } from 'react';
import { Bar, BarChart, Cell, ReferenceLine, XAxis } from 'recharts';

type AdherenceChartProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function AdherenceChart({ selectedDate, onSelectDate }: AdherenceChartProps) {
  const { getWeeklyAdherence } = useNutrition();
  const { days, adherencePercent } = getWeeklyAdherence();
  const loggedDays = days.filter((d) => d.calories > 0);
  const hasLoggedDays = loggedDays.length > 0;
  const [firstDay] = days;
  const referenceTarget = firstDay?.target ?? 0;
  const chartData = days.map((d) => ({
    ...d,
    deviationPct: formatAdherenceDeviation(d.calories, d.target),
  }));
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  const chartConfig = {
    calories: { label: 'Consumido', color: 'hsl(var(--primary))' },
    target: { label: 'Objetivo', color: 'hsl(var(--muted-foreground))' },
  } satisfies ChartConfig;

  const getBarColor = (idx: number) => {
    const day = chartData[idx];
    if (!day) return 'hsl(var(--muted))';
    if (day.date === selectedDate) return 'hsl(var(--accent))';
    if (day.withinTarget) return 'rgba(132, 204, 22, 0.8)';
    if (day.calories > 0) return 'hsl(var(--primary))';
    return 'hsl(var(--muted))';
  };

  const handleBarSelect = (index: number, date: string) => {
    setActiveTooltipIndex(index);
    onSelectDate(date);
  };

  const handleChartClick = (state: { activeTooltipIndex?: number }) => {
    if (state.activeTooltipIndex == null) return;
    const point = chartData[state.activeTooltipIndex];
    if (!point) return;
    handleBarSelect(state.activeTooltipIndex, point.date);
  };

  const tooltipPayload =
    activeTooltipIndex != null
      ? ([
          {
            dataKey: 'calories',
            name: 'calories',
            value: chartData[activeTooltipIndex]?.calories ?? 0,
            payload: chartData[activeTooltipIndex],
            color: getBarColor(activeTooltipIndex),
          },
          {
            dataKey: 'target',
            name: 'target',
            value: chartData[activeTooltipIndex]?.target ?? 0,
            payload: chartData[activeTooltipIndex],
            color: 'hsl(var(--muted-foreground))',
          },
        ] as const)
      : undefined;

  return (
    <div className="brand-card space-y-4 rounded-2xl p-6" aria-label={`Adherencia semanal, ${adherencePercent} por ciento`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Adherencia semanal</h2>
        <span className="text-2xl font-black text-primary">{adherencePercent}%</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Días dentro de ±10% de tu objetivo calórico (solo días con registro en el diario).
      </p>
      {!hasLoggedDays ? (
        <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Registra comidas en el diario para ver tu adherencia.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-48 w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} onClick={handleChartClick}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            {referenceTarget > 0 ? (
              <ReferenceLine y={referenceTarget} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            ) : null}
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
              {...(activeTooltipIndex != null
                ? {
                    active: true,
                    label: chartData[activeTooltipIndex]?.label,
                    payload: tooltipPayload as unknown as any[],
                  }
                : {})}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    if (name === 'target') return <span>Objetivo: {value} kcal</span>;
                    const row = item.payload as { deviationPct: number | null; calories: number };
                    if (row.calories <= 0) return <span>Sin registro</span>;
                    if (row.deviationPct == null) return <span>Consumido: {value} kcal</span>;
                    const status = Math.abs(row.deviationPct) <= 10 ? 'Dentro de ±10%' : `${row.deviationPct}%`;
                    return (
                      <div className="flex flex-col">
                        <span>Consumido: {value} kcal</span>
                        <span>{status}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]} barSize={24} minPointSize={44} cursor="pointer">
              {chartData.map((row, idx) => (
                <Cell
                  key={row.date}
                  fill={getBarColor(idx)}
                  stroke={row.date === selectedDate ? 'hsl(var(--ring))' : 'transparent'}
                  strokeWidth={row.date === selectedDate ? 2 : 0}
                  onClick={() => handleBarSelect(idx, row.date)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
