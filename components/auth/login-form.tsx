'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { getHomeRouteForRole } from '@/lib/auth/role-routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const loggedInUser = await login(email, password);
      router.push(getHomeRouteForRole(loggedInUser.role));
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="brand-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary brand-glow-primary">
            <span className="text-2xl font-black text-primary-foreground">FT</span>
          </div>
          <p className="brand-kicker">Entrada a la arena</p>
          <h1 className="brand-title text-5xl font-black brand-text-gradient">Iniciar sesión</h1>
          <p className="text-base text-muted-foreground">
            Transforma tu entrenamiento con planes personalizados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">¿No tienes cuenta?</span>
          </div>
        </div>

        <Link href="/register">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-2 border-secondary text-base text-secondary hover:bg-secondary/5"
          >
            Crear nueva cuenta
          </Button>
        </Link>

        <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-4 backdrop-blur-sm space-y-3">
          <p className="text-xs font-semibold text-foreground">Demo — contraseña: password123</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Atleta</span>
              <code className="font-mono text-primary">test@example.com</code>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Admin</span>
              <code className="font-mono text-primary">admin@example.com</code>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Entrenador</span>
              <code className="font-mono text-primary">trainer@example.com</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
