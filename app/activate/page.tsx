import { Suspense } from 'react';
import { ActivateAccountForm } from '@/components/auth/activate-account-form';
import { Navbar } from '@/components/layout/navbar';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Activar cuenta - FitTrack',
  description: 'Activa tu cuenta de entrenador en FitTrack',
};

function ActivateFallback() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ActivatePage() {
  return (
    <>
      <Navbar />
      <main className="brand-shell relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
        <div className="brand-grid absolute inset-x-0 top-0 h-80 opacity-60" aria-hidden="true" />
        <Suspense fallback={<ActivateFallback />}>
          <ActivateAccountForm />
        </Suspense>
      </main>
    </>
  );
}
