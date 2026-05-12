'use client';

import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useState } from 'react';

export function ExpirationAlert() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user?.membership || dismissed) return null;

  const daysRemaining = user.membership.daysRemaining;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  if (!isExpiringSoon && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
        <div className="bg-gradient-to-r from-destructive/20 to-red-500/20 border-2 border-destructive rounded-xl p-4 flex items-start gap-4 shadow-lg">
          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-destructive">Tu membresía ha expirado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Renueva tu plan para continuar disfrutando de todas las características
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/memberships">
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-red-700 transition">
                Renovar Ahora
              </button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500 rounded-xl p-4 flex items-start gap-4 shadow-lg">
        <Clock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-amber-600">Tu membresía vence pronto</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {daysRemaining === 1
              ? 'Tu plan vence mañana. '
              : `Tu plan vence en ${daysRemaining} días. `}
            Renuévalo ahora para no interrumpir tu entrenamiento.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/memberships">
            <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition">
              Renovar
            </button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
