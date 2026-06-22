import { Suspense } from 'react';

import AdminSupportPage from './page-client';

export default function AdminSupportRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm gp-text-muted">Cargando soporte…</div>}>
      <AdminSupportPage />
    </Suspense>
  );
}
