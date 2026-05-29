import type { Metric } from '@/lib/data/types';

export interface MetricsListQuery {
  athleteId: string;
}

export type MetricsListResponse = Metric[];

export type CreateMetricRequest = Omit<Metric, 'id' | 'athleteId'> & {
  athleteId: string;
};

export type CreateMetricResponse = Metric;

export type UpdateMetricRequest = Partial<Omit<Metric, 'id' | 'athleteId'>>;

export type UpdateMetricResponse = Metric;
