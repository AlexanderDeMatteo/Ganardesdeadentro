import { RegisterForm } from '@/components/auth/register-form';
import { Navbar } from '@/components/layout/navbar';

export const metadata = {
  title: 'Regístrate - FitTrack',
  description: 'Crea tu cuenta de FitTrack',
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="brand-shell relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
        <div className="brand-grid absolute inset-x-0 top-0 h-80 opacity-60" aria-hidden="true" />
        <div className="absolute top-20 right-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        <RegisterForm />
      </main>
    </>
  );
}
