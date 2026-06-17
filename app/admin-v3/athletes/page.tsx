import { Suspense } from 'react';
import PageClient from './page-client';

export default function AdminV3AthletesPage() {
  return (
    <Suspense fallback={<div className="text-xs text-[#8fa88a]">Cargando…</div>}>
      <PageClient />
    </Suspense>
  );
}
