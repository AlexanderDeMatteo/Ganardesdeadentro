import type { ExerciseReviewItem } from '@/lib/coach/exercise-review';
import type { CoachMood } from '@/lib/coach/types';
import type { SessionOutcome, SessionQualityTone } from '@/lib/ollama/types';

export type ExerciseSectionLines = {
  fallos: string[];
  ajustes: string[];
  destacados: string[];
};

export function buildExerciseSectionLines(exercises: ExerciseReviewItem[]): ExerciseSectionLines {
  const fallos: string[] = [];
  const ajustes: string[] = [];
  const destacados: string[] = [];

  for (const e of exercises) {
    switch (e.status) {
      case 'fallo': {
        if (e.failedSetDetails?.length) {
          for (const detail of e.failedSetDetails) {
            const weightPart =
              detail.weightKg != null ? ` @ ${detail.weightKg} kg` : '';
            const suggestedPart =
              e.suggestedWeightKg != null ? ` (sugerido ${e.suggestedWeightKg} kg)` : '';
            fallos.push(
              `${e.label} serie ${detail.setNumber}: ${detail.repsLogged} reps${weightPart}${suggestedPart} — baja carga o alarga descanso.`,
            );
          }
        } else {
          fallos.push(
            `${e.label}: ${e.failedSets}/${e.plannedSets} Me rindo — baja carga o alarga descanso.`,
          );
        }
        break;
      }
      case 'ajuste': {
        const detail = e.failedSetDetails?.[0];
        if (detail) {
          const weightPart = detail.weightKg != null ? ` @ ${detail.weightKg} kg` : '';
          ajustes.push(
            `${e.label} serie ${detail.setNumber}: ${detail.repsLogged} reps${weightPart} — revisa tecnica o fatiga.`,
          );
        } else {
          ajustes.push(
            `${e.label}: 1 Me rindo de ${e.plannedSets} series — revisa tecnica o fatiga.`,
          );
        }
        break;
      }
      case 'excelente': {
        const bestPart =
          e.bestWeightKg != null ? ` Mejor carga: ${e.bestWeightKg} kg.` : '';
        destacados.push(
          `${e.label}: ${e.completedSets}/${e.plannedSets} series completadas.${bestPart}`,
        );
        break;
      }
      default:
        break;
    }
  }

  return { fallos, ajustes, destacados };
}

export function deriveCoachMoodFromExercises(
  exercises: ExerciseReviewItem[],
  qualityTone: SessionQualityTone,
  sessionOutcome: SessionOutcome,
): CoachMood {
  const hasFallo = exercises.some((e) => e.status === 'fallo');
  const hasAjuste = exercises.some((e) => e.status === 'ajuste');

  if (hasFallo || qualityTone === 'danger') return 'warning';
  if (hasAjuste || qualityTone === 'warning' || sessionOutcome === 'abandoned') return 'speaking';
  if (qualityTone === 'success' && sessionOutcome === 'completed') return 'celebrating';
  return 'speaking';
}
