import {
  buildExerciseSectionLines,
  deriveCoachMoodFromExercises,
} from '@/lib/coach/session-review-sections';
import type {
  SessionReviewMetrics,
  TitanCoachMood,
  TitanSessionReviewLlmPayload,
  TitanSessionReviewPayload,
} from '@/lib/ollama/types';

const VALID_TONES: TitanCoachMood[] = ['celebrating', 'speaking', 'warning'];

function toTitanCoachMood(mood: ReturnType<typeof deriveCoachMoodFromExercises>): TitanCoachMood {
  if (VALID_TONES.includes(mood as TitanCoachMood)) {
    return mood as TitanCoachMood;
  }
  return 'speaking';
}

export function sanitizeLlmLine(line: string): string | null {
  let s = line.trim();
  s = s.replace(/\[\s*\]/g, '').trim();
  s = s.replace(/^[-•*]\s*/, '').trim();
  if (s.length < 3 || s.length > 280) return null;
  if (/^[\[\]\s,.;:]+$/.test(s)) return null;
  return s;
}

export function sanitizeLlmLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const clean = sanitizeLlmLine(line);
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= 3) break;
  }
  return out;
}

export function mergeSessionReview(
  userName: string,
  metrics: SessionReviewMetrics,
  llm: TitanSessionReviewLlmPayload | null,
): TitanSessionReviewPayload {
  const sections = buildExerciseSectionLines(metrics.exercises);
  const resumenLlm = llm?.resumen ? sanitizeLlmLine(llm.resumen) : null;
  const recomendaciones = llm?.recomendaciones ? sanitizeLlmLines(llm.recomendaciones) : [];

  const resumen =
    resumenLlm ??
    (metrics.sessionOutcome === 'completed' && metrics.qualityTone === 'success'
      ? `${userName}, sesion solida en "${metrics.routineName}".`
      : `${userName}, sesion exigente en "${metrics.routineName}" con margenes claros de mejora.`);

  const fallbackRecomendaciones: string[] = [];
  if (sections.fallos.length > 0 && recomendaciones.length < 3) {
    fallbackRecomendaciones.push(
      'Prioriza tecnica y recuperacion antes de subir volumen en el bloque que mas te costo.',
    );
  }
  if (sections.ajustes.length > 0 && recomendaciones.length + fallbackRecomendaciones.length < 3) {
    fallbackRecomendaciones.push('En el ejercicio con un Me rindo, baja un escalon o alarga el descanso.');
  }
  if (
    sections.destacados.length > 0 &&
    (sections.fallos.length > 0 || sections.ajustes.length > 0) &&
    recomendaciones.length + fallbackRecomendaciones.length < 3
  ) {
    fallbackRecomendaciones.push('Replica el ritmo de los ejercicios que cerraste bien en la proxima sesion.');
  }

  const mergedRecomendaciones = [...recomendaciones, ...fallbackRecomendaciones].slice(0, 3);
  if (mergedRecomendaciones.length === 0) {
    mergedRecomendaciones.push('Mantén la constancia; cada sesion registrada suma.');
  }

  const tonoFromLlm =
    llm?.tono && VALID_TONES.includes(llm.tono) ? llm.tono : null;
  const tono =
    tonoFromLlm ??
    toTitanCoachMood(
      deriveCoachMoodFromExercises(metrics.exercises, metrics.qualityTone, metrics.sessionOutcome),
    );

  return {
    usuario: userName,
    tono,
    resumen,
    fallos: sections.fallos,
    ajustes: sections.ajustes,
    destacados: sections.destacados,
    recomendaciones: mergedRecomendaciones,
  };
}
