import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Regístrate - FitTrack',
  description: 'Crea tu cuenta de FitTrack',
};

export default function RegisterPage() {
  return (
    <AuthPageShell
      kicker="Nuevo atleta"
      headline="Únete a la élite."
      subcopy="Crea tu cuenta y accede a rutinas, métricas y nutrición diseñadas para ganar de verdad — no para llenar un feed."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
