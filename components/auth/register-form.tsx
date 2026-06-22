'use client';

import { useAuth } from '@/app/context/auth-context';
import { LuminousButton } from '@/components/landing/aceternity/luminous-button';
import { CoachParallaxCard } from '@/components/landing/coach-parallax-card';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { getHomeRouteForRole } from '@/lib/auth/role-routes';
import { LANDING_MASCOT_V2 } from '@/lib/landing/mascot-config';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

const STAGGER = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 26 },
  },
};

const inputClassName = cn(
  'h-12 border-white/10 bg-[rgb(18_26_22_/_0.7)] text-white placeholder:text-white/30',
  'focus-visible:border-[var(--landing-green)]/60 focus-visible:ring-[3px] focus-visible:ring-[rgb(104_202_98_/_0.12)]',
);

type RevealProps = {
  animate: boolean;
  as?: 'div' | 'form';
  className?: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
};

function Reveal({ animate, as = 'div', className, children, onSubmit }: RevealProps) {
  if (!animate) {
    if (as === 'form') {
      return (
        <form onSubmit={onSubmit} className={className}>
          {children}
        </form>
      );
    }
    return <div className={className}>{children}</div>;
  }

  if (as === 'form') {
    return (
      <motion.form variants={ITEM} className={className} onSubmit={onSubmit}>
        {children}
      </motion.form>
    );
  }

  return (
    <motion.div variants={ITEM} className={className}>
      {children}
    </motion.div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
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
      const user = await register(email, password, firstName, lastName);
      router.push(getHomeRouteForRole(user.role));
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  const displayError = error || localError;

  const body = (
    <>
      <Reveal
        animate={animate}
        className="mb-6 flex flex-col items-center text-center lg:mb-8 lg:items-start lg:text-left"
      >
        <div className="mb-5 scale-90 lg:hidden">
          <CoachParallaxCard mascot={LANDING_MASCOT_V2} showGreeting={false} className="mx-auto" />
        </div>
        <h2 className="landing-heading text-3xl text-[var(--landing-green)] sm:text-4xl">Crear cuenta</h2>
        <p className="mt-2 text-sm text-white/55">Únete y empieza a entrenar con propósito.</p>
      </Reveal>

      <Reveal animate={animate} as="form" onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-300">{displayError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--landing-green-pastel)]"
            >
              Nombre
            </label>
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              required
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--landing-green-pastel)]"
            >
              Apellido
            </label>
            <Input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
              className={inputClassName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--landing-green-pastel)]"
          >
            Correo electrónico
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--landing-green-pastel)]"
          >
            Contraseña
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className={inputClassName}
          />
          <p className="text-xs text-white/40">Mínimo 8 caracteres</p>
        </div>

        <LuminousButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </LuminousButton>
      </Reveal>

      <Reveal animate={animate} className="relative my-6">
        <div className="landing-v4-divider absolute inset-x-0 top-1/2" aria-hidden />
        <p className="relative mx-auto w-fit bg-[color-mix(in_srgb,var(--landing-surface)_85%,transparent)] px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          ¿Ya tienes cuenta?
        </p>
      </Reveal>

      <Reveal animate={animate}>
        <Link href="/login" className="block w-full">
          <LuminousButton type="button" luminousVariant="ghost" className="w-full">
            Iniciar sesión
          </LuminousButton>
        </Link>
      </Reveal>
    </>
  );

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[color-mix(in_srgb,var(--landing-surface)_85%,transparent)] p-6 backdrop-blur-xl sm:p-8">
      {animate ? (
        <motion.div variants={STAGGER} initial="hidden" animate="visible">
          {body}
        </motion.div>
      ) : (
        body
      )}
    </div>
  );
}
