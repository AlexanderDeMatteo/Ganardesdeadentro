'use client';

import { useMemo } from 'react';

import type { MuscleGroup } from '@/lib/api/contracts/biomechanics';
import { ACTIVE_COLOR, BASE_COLOR, MUSCLE_MAP } from '@/lib/biomechanics/muscle-map';
import { BodySvg } from '@/components/biomechanics/body-svg';
import type { MuscleRendererProps } from '@/components/biomechanics/renderer-types';

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

const BASE_RGB = hexToRgb(BASE_COLOR);
const ACTIVE_RGB = hexToRgb(ACTIVE_COLOR);

function mixColor(activation: number): string {
  const t = Math.min(1, Math.max(0, activation));
  const r = Math.round(BASE_RGB[0] + (ACTIVE_RGB[0] - BASE_RGB[0]) * t);
  const g = Math.round(BASE_RGB[1] + (ACTIVE_RGB[1] - BASE_RGB[1]) * t);
  const b = Math.round(BASE_RGB[2] + (ACTIVE_RGB[2] - BASE_RGB[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function MuscleMap2D({ activaciones, className }: MuscleRendererProps) {
  const regionColors = useMemo(() => {
    const map: Record<string, string> = {};
    (Object.keys(MUSCLE_MAP) as MuscleGroup[]).forEach((group) => {
      const color = mixColor(activaciones[group] ?? 0);
      MUSCLE_MAP[group].svgRegions.forEach((regionId) => {
        map[regionId] = color;
      });
    });
    return map;
  }, [activaciones]);

  const getFill = (regionId: string) => regionColors[regionId] ?? BASE_COLOR;

  return <BodySvg getFill={getFill} className={className} />;
}
