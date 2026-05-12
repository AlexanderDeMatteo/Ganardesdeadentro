'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

export type CoachMood = 'idle' | 'speaking' | 'celebrating' | 'warning';

export interface CoachTip {
  eyebrow: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  mood: CoachMood;
}

const COACH_DISMISSED_KEY = 'fittrack.coach.dismissed';

const tipsByRoute: Array<{ match: RegExp; tip: CoachTip }> = [
  {
    match: /^\/login/,
    tip: {
      eyebrow: 'Coach listo',
      message: 'Entra a la arena y retomemos tu transformacion.',
      actionLabel: 'Iniciar',
      actionHref: '/login',
      mood: 'speaking',
    },
  },
  {
    match: /^\/register/,
    tip: {
      eyebrow: 'Nuevo retador',
      message: 'Crea tu cuenta y empieza con una meta clara desde hoy.',
      actionLabel: 'Crear cuenta',
      actionHref: '/register',
      mood: 'celebrating',
    },
  },
  {
    match: /^\/dashboard/,
    tip: {
      eyebrow: 'Mision diaria',
      message: 'Revisa tus objetivos, elige tu proximo entrenamiento y conserva la racha.',
      actionLabel: 'Ver rutinas',
      actionHref: '/routines',
      mood: 'speaking',
    },
  },
  {
    match: /^\/routines/,
    tip: {
      eyebrow: 'Plan de combate',
      message: 'Selecciona una rutina que puedas completar hoy. La constancia gana.',
      actionLabel: 'Medir progreso',
      actionHref: '/metrics',
      mood: 'idle',
    },
  },
  {
    match: /^\/metrics/,
    tip: {
      eyebrow: 'Datos de campeon',
      message: 'Registra tus medidas con calma. Tus numeros cuentan la historia real.',
      mood: 'speaking',
    },
  },
  {
    match: /^\/memberships/,
    tip: {
      eyebrow: 'Acceso elite',
      message: 'Elige el plan que sostenga tu ritmo sin perder funciones clave.',
      mood: 'warning',
    },
  },
  {
    match: /^\/admin/,
    tip: {
      eyebrow: 'Centro de control',
      message: 'Gestiona contenido y atletas manteniendo la experiencia clara.',
      mood: 'idle',
    },
  },
];

const fallbackTip: CoachTip = {
  eyebrow: 'Tu coach',
  message: 'Estoy aqui para ayudarte a mantener el foco en tu progreso.',
  actionLabel: 'Ir al dashboard',
  actionHref: '/dashboard',
  mood: 'idle',
};

export function useCoachTips() {
  const pathname = usePathname();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setIsMinimized(localStorage.getItem(COACH_DISMISSED_KEY) === 'true');
  }, []);

  const tip = useMemo(() => {
    return tipsByRoute.find(({ match }) => match.test(pathname))?.tip ?? fallbackTip;
  }, [pathname]);

  const minimize = () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    setIsMinimized(true);
  };

  const restore = () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'false');
    setIsMinimized(false);
  };

  return {
    tip,
    isMinimized,
    minimize,
    restore,
  };
}
