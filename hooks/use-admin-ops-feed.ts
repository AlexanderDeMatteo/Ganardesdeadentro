'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminActivityItem, AdminAlert } from '@/lib/admin-v2/admin-ops-feed';
import {
  buildAdminActivityLog,
  buildAdminAlerts,
  countUnreadAlerts,
  OPS_FEED_POLL_INTERVAL_MS,
  readAlertsReadAt,
  writeAlertsReadAt,
} from '@/lib/admin-v2/admin-ops-feed';
import type { AdminDashboardMetricsResponse } from '@/lib/api/contracts/admin';
import { useAdminDashboardMetrics } from '@/hooks/use-admin-dashboard-metrics';
import { useAdmin } from '@/hooks/use-admin';

export function useAdminOpsFeed() {
  const { athletes, trainers } = useAdmin();
  const {
    isLoading,
    athletesWithoutTrainer,
    memberships,
    capacity,
    atRiskAthletes,
    telemetryStats,
    operationsQueue,
    refreshDashboardMetrics,
  } = useAdminDashboardMetrics();

  const [readAt, setReadAt] = useState<string | null>(null);

  useEffect(() => {
    setReadAt(readAlertsReadAt());
  }, []);

  const metrics = useMemo<AdminDashboardMetricsResponse>(
    () => ({
      memberships,
      capacity,
      retention: { atRisk: atRiskAthletes },
      telemetry: telemetryStats,
      operations: { unassigned: operationsQueue },
    }),
    [memberships, capacity, atRiskAthletes, telemetryStats, operationsQueue],
  );

  const feedInput = useMemo(
    () => ({
      metrics,
      trainers,
      athletes,
      athletesWithoutTrainer,
    }),
    [metrics, trainers, athletes, athletesWithoutTrainer],
  );

  const alerts = useMemo<AdminAlert[]>(() => buildAdminAlerts(feedInput), [feedInput]);
  const activityLog = useMemo<AdminActivityItem[]>(
    () => buildAdminActivityLog(feedInput),
    [feedInput],
  );

  const badgeCount = useMemo(() => countUnreadAlerts(alerts, readAt), [alerts, readAt]);

  const refresh = useCallback(async () => {
    await refreshDashboardMetrics();
  }, [refreshDashboardMetrics]);

  const markAlertsRead = useCallback(() => {
    const iso = new Date().toISOString();
    writeAlertsReadAt(iso);
    setReadAt(iso);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }, OPS_FEED_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return {
    alerts,
    activityLog,
    badgeCount,
    markAlertsRead,
    isLoading,
    refresh,
  };
}
