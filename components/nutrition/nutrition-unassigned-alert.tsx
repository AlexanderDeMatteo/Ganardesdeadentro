'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNutrition } from '@/hooks/use-nutrition';
import { Info } from 'lucide-react';

export function NutritionUnassignedAlert() {
  const { hasAssignedPlan, isLoading } = useNutrition();

  if (isLoading || hasAssignedPlan) return null;

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Info className="text-primary" aria-hidden />
      <AlertTitle className="text-foreground">Plan nutricional pendiente</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Tu entrenador está preparando tu plan de macros y comidas. Mientras tanto puedes usar el diario para
        registrar lo que comes.
      </AlertDescription>
    </Alert>
  );
}
