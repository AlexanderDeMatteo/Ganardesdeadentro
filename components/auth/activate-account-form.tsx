'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (!token) {
        setTokenError('Enlace inválido o expirado');
        setIsLoadingToken(false);
        return;
      }
      const client = getAuthClient();
      if (!client.validateInviteToken) {
        setTokenError('Activación no disponible en este entorno');
        setIsLoadingToken(false);
        return;
      }
      try {
        const info = await client.validateInviteToken(token);
        if (cancelled) return;
        setEmail(info.email);
        setFirstName(info.firstName);
      } catch {
        if (!cancelled) setTokenError('Enlace inválido o expirado');
      } finally {
        if (!cancelled) setIsLoadingToken(false);
      }
    }
    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    const client = getAuthClient();
    if (!client.acceptInvite) {
      setFormError('Activación no disponible en este entorno');
      return;
    }
    setIsSubmitting(true);
    try {
      await client.acceptInvite(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login?activated=1'), 1500);
    } catch {
      setFormError('No se pudo activar la cuenta. El enlace puede haber expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="brand-card w-full max-w-md rounded-2xl p-6 sm:p-8">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary brand-glow-primary overflow-hidden">
            <Image
              src="/brand/be-a-gainer-logo.png"
              alt="Be a Gainer"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <p className="brand-kicker">Entrenador Be a Gainer</p>
          <h1 className="brand-title text-4xl font-black brand-text-gradient">Activar cuenta</h1>
          <p className="text-base text-muted-foreground">
            Define tu contraseña para acceder a la plataforma
          </p>
        </div>

        {isLoadingToken ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tokenError ? (
          <div className="space-y-4 text-center">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{tokenError}</p>
            </div>
            <Link href="/login" className="text-primary hover:underline text-sm">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium">Cuenta activada correctamente</p>
            <p className="text-sm text-muted-foreground">Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg bg-secondary/10 p-4 border border-secondary/20">
              <p className="text-sm text-muted-foreground">Activando cuenta para</p>
              <p className="font-semibold">{firstName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            {formError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <div>
              <label htmlFor="activate-password" className="text-sm font-medium mb-2 block">
                Contraseña
              </label>
              <Input
                id="activate-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label htmlFor="activate-confirm-password" className="text-sm font-medium mb-2 block">
                Confirmar contraseña
              </label>
              <Input
                id="activate-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              {isSubmitting ? 'Activando...' : 'Activar cuenta'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
