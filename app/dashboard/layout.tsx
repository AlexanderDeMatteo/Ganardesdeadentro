import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="dashboard-v3-root min-h-screen">{children}</div>;
}
