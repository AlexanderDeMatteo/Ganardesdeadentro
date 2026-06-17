'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminDashboardMetricsResponse } from '@/lib/api/contracts/admin';
import { getAdminDashboardMetrics } from '@/lib/data/client';
import { useAdmin } from '@/hooks/use-admin';

export type TrainerLoad = {
  trainer: import('@/hooks/use-admin').Trainer;
  athleteCount: number;
  loadPercent: number;
};

export type TelemetryEvent = {
  id: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
};

export type PendingAssignmentRow = {
  athlete: import('@/hooks/use-admin').Athlete;
  trainerName: string | null;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
};

export type CapacityTrendPoint = {
  day: string;
  load: number;
};

export type WeeklyBarPoint = {
  day: string;
  count: number;
};

export type AtRiskAthlete = AdminDashboardMetricsResponse['retention']['atRisk'][number];

export type OperationQueueRow = AdminDashboardMetricsResponse['operations']['unassigned'][number];

function buildTelemetry(
  athletesWithoutTrainer: number,
  routineCount: number,
  assignmentRate: number,
): TelemetryEvent[] {
  const now = Date.now();
  const events: TelemetryEvent[] = [];

  if (athletesWithoutTrainer > 0) {
    events.push({
      id: 'unassigned',
      timestamp: new Date(now - 2 * 60_000).toISOString(),
      message: `${athletesWithoutTrainer} atleta(s) sin entrenador asignado`,
      severity: athletesWithoutTrainer >= 5 ? 'critical' : 'warning',
    });
  }

  events.push({
    id: 'routines',
    timestamp: new Date(now - 8 * 60_000).toISOString(),
    message: `${routineCount} rutinas activas en plataforma`,
    severity: 'info',
  });

  events.push({
    id: 'assignment',
    timestamp: new Date(now - 15 * 60_000).toISOString(),
    message: `Tasa de asignación al ${assignmentRate}%`,
    severity: assignmentRate >= 80 ? 'info' : 'warning',
  });

  return events.slice(0, 5);
}

function computeTrainerLoads(
  trainers: import('@/hooks/use-admin').Trainer[],
  athletes: import('@/hooks/use-admin').Athlete[],
): TrainerLoad[] {
  const maxAthletes = Math.max(
    1,
    ...trainers.map((t) => athletes.filter((a) => a.trainerId === t.id).length),
  );

  return trainers
    .map((trainer) => {
      const athleteCount = athletes.filter((a) => a.trainerId === trainer.id).length;
      return {
        trainer,
        athleteCount,
        loadPercent: Math.round((athleteCount / maxAthletes) * 100),
      };
    })
    .sort((a, b) => b.athleteCount - a.athleteCount);
}

export function buildFallbackMetrics(
  athletes: import('@/hooks/use-admin').Athlete[],
  trainers: import('@/hooks/use-admin').Trainer[],
): AdminDashboardMetricsResponse {
  const activeTrainers = trainers.filter((t) => t.isActive !== false && !t.invitePending);
  const totalSlots = activeTrainers.reduce((sum, t) => sum + (t.maxAthletes ?? 10), 0);
  const currentLoad = athletes.filter((a) => a.trainerId).length;
  const loadPercent = totalSlots > 0 ? Math.round((currentLoad / totalSlots) * 100) : 0;
  const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
  const weeklyBars = DAY_LABELS.map((day, index) => ({
    day,
    count: Math.max(0, 1 + (index % 4)),
  }));

  const unassigned = athletes
    .filter((a) => !a.trainerId)
    .map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      joinDate: a.joinDate ?? '',
      priority:
        a.membershipLevel === 'pro'
          ? ('ALTA' as const)
          : a.membershipLevel === 'premium'
            ? ('MEDIA' as const)
            : ('BAJA' as const),
    }));

  return {
    memberships: {
      activeCount: athletes.filter((a) => a.membershipLevel !== 'basic').length,
      estimatedMrr: athletes.length * 24.5,
      mrrTrendPercent: 0,
    },
    capacity: {
      totalSlots,
      currentLoad,
      loadPercent,
      trend7d: weeklyBars.map((bar) => ({ day: bar.day, load: bar.count })),
    },
    retention: { atRisk: [] },
    telemetry: {
      workoutsCompletedThisWeek: weeklyBars.reduce((sum, bar) => sum + bar.count, 0),
      metricsLoggedToday: 0,
      weeklyBars,
    },
    operations: { unassigned },
  };
}

export function useAdminDashboardMetrics() {
  const {
    athletes,
    trainers,
    routines,
    overview,
    isLoading: adminLoading,
    refreshOverview,
    refreshUserLists,
  } = useAdmin();

  const [dashboardMetrics, setDashboardMetrics] = useState<AdminDashboardMetricsResponse | null>(
    null,
  );
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const refreshDashboardMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await getAdminDashboardMetrics();
      setDashboardMetrics(data);
      setMetricsError(null);
    } catch (error) {
      setMetricsError(
        error instanceof Error ? error.message : 'No se pudieron cargar las métricas del dashboard',
      );
      setDashboardMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshOverview(), refreshUserLists(), refreshDashboardMetrics()]);
  }, [refreshOverview, refreshUserLists, refreshDashboardMetrics]);

  useEffect(() => {
    void refreshDashboardMetrics();
  }, [refreshDashboardMetrics]);

  return useMemo(() => {
    const metrics = dashboardMetrics ?? buildFallbackMetrics(athletes, trainers);
    const athleteCount = overview?.athleteCount ?? athletes.length;
    const trainerCount = overview?.trainerCount ?? trainers.length;
    const athletesWithoutTrainer =
      overview?.athletesWithoutTrainer ?? metrics.operations.unassigned.length;
    const activeTrainerCount = trainers.filter(
      (t) => t.isActive !== false && !t.invitePending,
    ).length;
    const assignmentRate =
      athleteCount > 0
        ? Math.round(((athleteCount - athletesWithoutTrainer) / athleteCount) * 100)
        : 0;

    const pendingAssignments: PendingAssignmentRow[] = metrics.operations.unassigned
      .slice(0, 8)
      .map((row) => {
        const athlete = athletes.find((a) => a.id === row.id);
        return {
          athlete: athlete ?? {
            id: row.id,
            name: row.name,
            email: row.email,
            age: 0,
            gender: 'unknown',
            weight: 0,
            height: 0,
            joinDate: row.joinDate,
            membershipLevel: 'basic',
          },
          trainerName: null,
          priority: row.priority,
        };
      });

    const activeTrainers = trainers.filter((t) => t.isActive !== false && !t.invitePending);
    const trainerLoads = computeTrainerLoads(activeTrainers, athletes);
    const unassignedAthletes = athletes.filter((a) => !a.trainerId);
    const telemetry = buildTelemetry(athletesWithoutTrainer, routines.length, assignmentRate);
    const commandFeed = unassignedAthletes.slice(0, 5).map((athlete) => ({
      id: athlete.id,
      type: 'assignment' as const,
      label: 'ASIGNACIÓN_PENDIENTE',
      detail: `${athlete.name} — sin entrenador`,
      href: `/admin-v2/athletes?athlete=${athlete.id}`,
    }));

    return {
      isLoading: adminLoading || metricsLoading,
      metricsError,
      athleteCount,
      trainerCount,
      activeTrainerCount,
      athletesWithoutTrainer,
      routineCount: routines.length,
      assignmentRate,
      memberships: metrics.memberships,
      capacity: metrics.capacity,
      atRiskAthletes: metrics.retention.atRisk,
      telemetryStats: metrics.telemetry,
      operationsQueue: metrics.operations.unassigned,
      pendingAssignments,
      capacityTrend: metrics.capacity.trend7d,
      refreshDashboardMetrics: refreshAll,
      unassignedAthletes,
      trainerLoads,
      topTrainerLoads: trainerLoads.slice(0, 4),
      telemetry,
      commandFeed,
    };
  }, [
    adminLoading,
    metricsLoading,
    metricsError,
    dashboardMetrics,
    athletes,
    trainers,
    routines,
    overview,
    refreshAll,
  ]);
}
