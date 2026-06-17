import { Suspense } from 'react';
import PageClient from './page-client';

export default function AdminV2AthletesPage() {
  return (
    <Suspense fallback={<div className="gp-mono text-[#becab8]">Cargando atletas…</div>}>
      <PageClient />
    </Suspense>
  );
}
