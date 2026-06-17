'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PrimeCapacityReactor } from '@/components/admin-v2/prime-capacity-reactor';
import { PrimeKpiCard } from '@/components/admin-v2/prime-kpi-card';
import { PrimeOperationsQueue } from '@/components/admin-v2/prime-operations-queue';
import { PrimePlatformTelemetry } from '@/components/admin-v2/prime-platform-telemetry';
import { PrimeRetentionPanel } from '@/components/admin-v2/prime-retention-panel';
import { PrimeUnassignedAlertModal } from '@/components/admin-v2/prime-unassigned-alert-modal';
import { useAdminDashboardMetrics } from '@/hooks/use-admin-dashboard-metrics';
import { useAuth } from '@/app/context/auth-context';
import {
  AlertTriangle,
  Award,
  Calendar,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function formatToday() {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatMrr(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminV2DashboardPage() {
  const { user } = useAuth();
  const [unassignedModalOpen, setUnassignedModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    isLoading,
    athleteCount,
    trainerCount,
    activeTrainerCount,
    athletesWithoutTrainer,
    assignmentRate,
    memberships,
    capacity,
    atRiskAthletes,
    telemetryStats,
    operationsQueue,
    refreshDashboardMetrics,
  } = useAdminDashboardMetrics();

  const actionRequired = athletesWithoutTrainer > 0 || atRiskAthletes.length > 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboardMetrics();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg bg-[#242c27]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg bg-[#242c27]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-lg bg-[#242c27] lg:col-span-2" />
          <Skeleton className="h-80 rounded-lg bg-[#242c27]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className="gp-enter flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ '--gp-delay': '0ms' } as CSSProperties}
      >
        <div>
          <h2 className="gp-display text-3xl text-[#dce5de] neon-text-glow">Dashboard General</h2>
          <p className="gp-mono mt-1 text-sm text-[#becab8]">
            System Status:{' '}
            <span className={actionRequired ? 'text-[#ffb4ab]' : 'text-[#83e77b]'}>
              • {actionRequired ? 'Action required' : 'Optimal'}
            </span>
          </p>
          <p className="mt-1 text-sm text-[#899483]">
            Bienvenido, {user?.first_name}. Vista Gainer Prime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="gp-metric flex items-center gap-2 rounded-full border border-[#3f4a3c] bg-[#242c27] px-4 py-2 text-sm text-[#dce5de]">
            <Calendar className="h-4 w-4" aria-hidden />
            <span>{formatToday()}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="rounded-full border border-[#3f4a3c] p-2 text-[#becab8] transition-colors hover:border-[#68ca62] hover:text-[#68ca62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68ca62] disabled:opacity-50"
            aria-label="Actualizar métricas del dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PrimeKpiCard
          label="Atletas Activos"
          value={athleteCount}
          icon={Users}
          href="/admin-v2/athletes"
          layout="satellite"
          enterDelay={60}
          footer={`${assignmentRate}% asignados`}
          footerIcon={TrendingUp}
          footerClassName="text-[#83e77b]"
        />
        <PrimeKpiCard
          label="Entrenadores Activos"
          value={activeTrainerCount}
          icon={Award}
          href="/admin-v2/trainers"
          layout="satellite"
          enterDelay={120}
          footer={`de ${trainerCount} total`}
        />
        <PrimeKpiCard
          label="Membresías Activas"
          value={memberships.activeCount}
          icon={CreditCard}
          href="/admin-v2/memberships"
          layout="satellite"
          enterDelay={180}
          footer={`MRR est. ${formatMrr(memberships.estimatedMrr)}/mes`}
          footerIcon={TrendingUp}
          footerClassName="text-[#83e77b]"
        />
        <PrimeKpiCard
          label="Sin Entrenador"
          value={athletesWithoutTrainer}
          icon={AlertTriangle}
          layout="critical"
          enterDelay={240}
          onClick={() => setUnassignedModalOpen(true)}
          ariaLabel={`${athletesWithoutTrainer} atletas sin entrenador. Abrir alerta`}
          footer={athletesWithoutTrainer > 0 ? 'Requiere acción inmediata' : 'Todo asignado'}
          footerClassName="text-[#ffb4ab]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="gp-enter lg:col-span-2" style={{ '--gp-delay': '300ms' } as CSSProperties}>
          <PrimeCapacityReactor
            loadPercent={capacity.loadPercent}
            totalSlots={capacity.totalSlots}
            currentLoad={capacity.currentLoad}
            trend7d={capacity.trend7d}
          />
        </div>

        <div className="gp-enter" style={{ '--gp-delay': '360ms' } as CSSProperties}>
          <PrimeRetentionPanel atRiskAthletes={atRiskAthletes} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="gp-enter lg:col-span-2" style={{ '--gp-delay': '420ms' } as CSSProperties}>
          <PrimeOperationsQueue
            operations={operationsQueue}
            onAssigned={() => void refreshDashboardMetrics()}
          />
        </div>

        <div className="gp-enter" style={{ '--gp-delay': '480ms' } as CSSProperties}>
          <PrimePlatformTelemetry
            workoutsCompletedThisWeek={telemetryStats.workoutsCompletedThisWeek}
            metricsLoggedToday={telemetryStats.metricsLoggedToday}
            weeklyBars={telemetryStats.weeklyBars}
          />
        </div>
      </div>

      <PrimeUnassignedAlertModal
        open={unassignedModalOpen && athletesWithoutTrainer > 0}
        count={athletesWithoutTrainer}
        operations={operationsQueue}
        onClose={() => setUnassignedModalOpen(false)}
        onAssigned={() => void refreshDashboardMetrics()}
      />
    </div>
  );
}
