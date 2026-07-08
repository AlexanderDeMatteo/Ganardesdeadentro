import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar Sesión - Be a Gainer',
  description: 'Accede a tu cuenta de Be a Gainer',
};

export default function LoginPage() {
  return (
    <AuthPageShell
      kicker="Acceso seguro"
      headline="Entra a la arena."
      subcopy="Rutinas asignadas, métricas reales y nutrición con propósito. Tu progreso empieza donde termina la excusa."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
