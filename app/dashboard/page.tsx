'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { FitnessDashboardView } from '@/components/dashboard/fitness-dashboard-view';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <FitnessDashboardView />
    </ProtectedRoute>
  );
}
