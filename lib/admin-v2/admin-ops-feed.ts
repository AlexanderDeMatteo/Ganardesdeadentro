import type { AdminDashboardMetricsResponse } from '@/lib/api/contracts/admin';
import type { Athlete, Trainer } from '@/lib/data/types';

export const ADMIN_ALERTS_READ_AT_KEY = 'admin-v2-alerts-read-at';

export const OPS_FEED_POLL_INTERVAL_MS = 5 * 60 * 1000;

export type AdminAlertSeverity = 'critical' | 'warning' | 'info';

export type AdminAlert = {
  id: string;
  severity: AdminAlertSeverity;
  title: string;
  detail: string;
  href?: string;
  mailto?: string;
  createdAt: string;
};

export type AdminActivityCategory = 'activity' | 'operations' | 'telemetry';

export type AdminActivityItem = {
  id: string;
  category: AdminActivityCategory;
  message: string;
  createdAt: string;
  isStateSnapshot?: boolean;
};

export type OpsFeedInput = {
  metrics: AdminDashboardMetricsResponse;
  trainers: Trainer[];
  athletes: Athlete[];
  athletesWithoutTrainer: number;
};

const CAPACITY_WARNING_THRESHOLD = 85;
const RECENT_SIGNUP_DAYS = 7;

function nowIso(): string {
  return new Date().toISOString();
}

function severityRank(severity: AdminAlertSeverity): number {
  if (severity === 'critical') return 0;
  if (severity === 'warning') return 1;
  return 2;
}

export function buildAdminAlerts({
  metrics,
  trainers,
  athletesWithoutTrainer,
}: OpsFeedInput): AdminAlert[] {
  const alerts: AdminAlert[] = [];
  const createdAt = nowIso();

  if (athletesWithoutTrainer > 0) {
    alerts.push({
      id: 'unassigned-athletes',
      severity: 'critical',
      title: 'Sin entrenador',
      detail: `${athletesWithoutTrainer} atleta(s) pendientes de asignación`,
      href: '/admin-v2/assignments',
      createdAt,
    });
  }

  for (const atRisk of metrics.retention.atRisk) {
    if (atRisk.reason === 'expiring') {
      alerts.push({
        id: `expiring-${atRisk.athleteId}`,
        severity: 'warning',
        title: 'Membresía por vencer',
        detail: `${atRisk.name} — vence en ${atRisk.daysRemaining ?? 0} días`,
        href: `/admin-v2/athletes?athlete=${atRisk.athleteId}`,
        mailto: atRisk.email,
        createdAt,
      });
      continue;
    }

    alerts.push({
      id: `inactive-${atRisk.athleteId}`,
      severity: 'warning',
      title: 'Atleta inactivo',
      detail: `${atRisk.name} — ${atRisk.inactiveDays ?? 7}+ días sin actividad`,
      href: `/admin-v2/athletes?athlete=${atRisk.athleteId}`,
      mailto: atRisk.email,
      createdAt,
    });
  }

  if (metrics.capacity.loadPercent >= CAPACITY_WARNING_THRESHOLD) {
    alerts.push({
      id: 'capacity-saturation',
      severity: 'warning',
      title: 'Saturación operativa',
      detail: `Carga al ${metrics.capacity.loadPercent}% (${metrics.capacity.currentLoad}/${metrics.capacity.totalSlots} slots)`,
      href: '/admin-v2/assignments',
      createdAt,
    });
  }

  const activeTrainers = trainers.filter((t) => t.isActive !== false && !t.invitePending);
  for (const trainer of activeTrainers) {
    const capacity = trainer.maxAthletes ?? 10;
    if (trainer.athletes >= capacity) {
      alerts.push({
        id: `trainer-capacity-${trainer.id}`,
        severity: 'warning',
        title: 'Entrenador al límite',
        detail: `${trainer.name} — ${trainer.athletes}/${capacity} atletas`,
        href: '/admin-v2/assignments',
        createdAt,
      });
    }
  }

  const pendingInvites = trainers.filter((t) => t.invitePending);
  if (pendingInvites.length > 0) {
    alerts.push({
      id: 'trainer-invites-pending',
      severity: 'info',
      title: 'Invitaciones pendientes',
      detail: `${pendingInvites.length} entrenador(es) sin activar cuenta`,
      href: '/admin-v2/trainers',
      createdAt,
    });
  }

  return alerts.sort((a, b) => {
    const rank = severityRank(a.severity) - severityRank(b.severity);
    if (rank !== 0) return rank;
    return a.title.localeCompare(b.title);
  });
}

export function buildAdminActivityLog({
  metrics,
  athletes,
  athletesWithoutTrainer,
}: OpsFeedInput): AdminActivityItem[] {
  const items: AdminActivityItem[] = [];
  const now = Date.now();
  const weekAgo = now - RECENT_SIGNUP_DAYS * 24 * 60 * 60 * 1000;

  if (metrics.telemetry.workoutsCompletedThisWeek > 0) {
    items.push({
      id: 'telemetry-workouts-week',
      category: 'telemetry',
      message: `${metrics.telemetry.workoutsCompletedThisWeek} entrenamiento(s) completados esta semana`,
      createdAt: nowIso(),
    });
  }

  for (const bar of metrics.telemetry.weeklyBars) {
    if (bar.count <= 0) continue;
    items.push({
      id: `telemetry-day-${bar.day}`,
      category: 'telemetry',
      message: `${bar.count} entrenamiento(s) — ${bar.day}`,
      createdAt: nowIso(),
    });
  }

  if (metrics.telemetry.metricsLoggedToday > 0) {
    items.push({
      id: 'telemetry-metrics-today',
      category: 'activity',
      message: `${metrics.telemetry.metricsLoggedToday} métrica(s) registradas hoy`,
      createdAt: nowIso(),
    });
  }

  for (const athlete of athletes) {
    if (!athlete.joinDate) continue;
    const joined = new Date(athlete.joinDate).getTime();
    if (Number.isNaN(joined) || joined < weekAgo) continue;
    items.push({
      id: `signup-${athlete.id}`,
      category: 'activity',
      message: `Alta: ${athlete.name} se registró en la plataforma`,
      createdAt: athlete.joinDate,
    });
  }

  if (athletesWithoutTrainer > 0) {
    items.push({
      id: 'ops-unassigned-snapshot',
      category: 'operations',
      message: `${athletesWithoutTrainer} atleta(s) en cola de asignación`,
      createdAt: nowIso(),
      isStateSnapshot: true,
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function countUnreadAlerts(alerts: AdminAlert[], readAt: string | null): number {
  const readTime = readAt ? new Date(readAt).getTime() : 0;
  let count = 0;

  for (const alert of alerts) {
    if (alert.severity === 'critical') {
      count += 1;
      continue;
    }
    const alertTime = new Date(alert.createdAt).getTime();
    if (!readAt || alertTime > readTime) {
      count += 1;
    }
  }

  return count;
}

export function readAlertsReadAt(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_ALERTS_READ_AT_KEY);
}

export function writeAlertsReadAt(iso: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_ALERTS_READ_AT_KEY, iso);
}
