'use client';

import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function NutritionProfileAlert({
  missingProfile,
  missingWeight,
  weightDate,
}: {
  missingProfile: boolean;
  missingWeight: boolean;
  weightDate?: string;
}) {
  if (!missingProfile && !missingWeight) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-500/10">
      <AlertCircle className="text-amber-500" aria-hidden />
      <AlertTitle className="text-foreground">Completa tus datos</AlertTitle>
      <AlertDescription className="space-y-2 text-muted-foreground">
        {missingProfile && (
          <p>Necesitamos altura, edad y sexo en tu perfil para calcular TMB y TDEE.</p>
        )}
        {missingWeight && (
          <p>Registra tu peso en métricas para obtener cálculos precisos.</p>
        )}
        {weightDate && !missingWeight && (
          <p className="text-xs">Último peso registrado: {new Date(weightDate).toLocaleDateString('es-ES')}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {missingProfile && (
            <Button asChild size="sm" variant="outline">
              <Link href="/profile">Ir a perfil</Link>
            </Button>
          )}
          {missingWeight && (
            <Button asChild size="sm" variant="outline">
              <Link href="/metrics">Registrar peso</Link>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
