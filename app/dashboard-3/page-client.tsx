'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { FitnessDashboardView } from '@/components/dashboard/fitness-dashboard-view';

export default function Dashboard3Page() {
  return (
    <ProtectedRoute>
      <FitnessDashboardView />
    </ProtectedRoute>
  );
}
