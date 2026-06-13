'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await register(email, password, firstName, lastName);
      router.push('/dashboard');
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  const displayError = error || localError;

  return (
    <div className="brand-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary brand-glow-primary">
            <span className="text-2xl font-black text-primary-foreground">FT</span>
          </div>
          <p className="brand-kicker">Nuevo retador</p>
          <h1 className="brand-title text-5xl font-black brand-text-gradient">Únete a FitTrack</h1>
          <p className="text-base text-muted-foreground">
            Comienza tu transformación hoy mismo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {displayError && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-destructive">{displayError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
                Nombre
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">
                Apellido
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                required
                className="h-11 text-base"
              />
            </div>
          </div>

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
              required
              className="h-11 text-base"
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
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">¿Ya tienes cuenta?</span>
          </div>
        </div>

        <Link href="/login">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-2 border-secondary text-base text-secondary hover:bg-secondary/5"
          >
            Inicia sesión aquí
          </Button>
        </Link>

        <div className="space-y-3 rounded-xl border border-accent/20 bg-accent/10 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground">
              <p className="font-semibold mb-1">Qué incluye tu cuenta:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Planes de entrenamiento personalizados</li>
                <li>✓ Seguimiento de métricas</li>
                <li>✓ Historial de progreso</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
