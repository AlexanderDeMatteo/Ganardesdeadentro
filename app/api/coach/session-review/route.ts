import { NextResponse } from 'next/server';
import type { ExerciseReviewItem, ExerciseReviewStatus } from '@/lib/coach/exercise-review';
import {
  applyRouteGuard,
  isNextResponse,
  requireTitanMotivationAccess,
} from '@/lib/api/titan-route-guard';
import { pickSessionReviewFallback } from '@/lib/coach/session-review-fallback';
import { generateTitanSessionReview } from '@/lib/ollama/client';
import {
  OllamaParseError,
  OllamaUnavailableError,
  type SessionOutcome,
  type SessionQualityTone,
  type SessionReviewMetrics,
} from '@/lib/ollama/types';

const MAX_USER_NAME_LENGTH = 80;
const MAX_ROUTINE_NAME_LENGTH = 120;
const MAX_EXERCISE_LABEL_LENGTH = 120;
const MAX_EXERCISES = 24;
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/;

const QUALITY_TONES: SessionQualityTone[] = ['success', 'warning', 'danger', 'neutral'];
const SESSION_OUTCOMES: SessionOutcome[] = ['completed', 'abandoned'];
const EXERCISE_STATUSES: ExerciseReviewStatus[] = ['excelente', 'fallo', 'ajuste', 'pendiente'];

function validateUserName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_USER_NAME_LENGTH) return null;
  if (CONTROL_CHAR_REGEX.test(trimmed)) return null;
  return trimmed;
}

function validateRoutineName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_ROUTINE_NAME_LENGTH) return null;
  if (CONTROL_CHAR_REGEX.test(trimmed)) return null;
  return trimmed;
}

function validateNonNegativeInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null;
  return value;
}

function validateQualityTone(value: unknown): SessionQualityTone | null {
  if (typeof value !== 'string') return null;
  return QUALITY_TONES.includes(value as SessionQualityTone) ? (value as SessionQualityTone) : null;
}

function validateSessionOutcome(value: unknown): SessionOutcome | null {
  if (typeof value !== 'string') return null;
  return SESSION_OUTCOMES.includes(value as SessionOutcome) ? (value as SessionOutcome) : null;
}

function validateExerciseItem(value: unknown): ExerciseReviewItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const o = value as Record<string, unknown>;
  if (typeof o.label !== 'string') return null;
  const label = o.label.trim();
  if (label.length < 1 || label.length > MAX_EXERCISE_LABEL_LENGTH) return null;
  if (CONTROL_CHAR_REGEX.test(label)) return null;
  if (typeof o.status !== 'string' || !EXERCISE_STATUSES.includes(o.status as ExerciseReviewStatus)) {
    return null;
  }
  const completedSets = validateNonNegativeInt(o.completedSets);
  const failedSets = validateNonNegativeInt(o.failedSets);
  const plannedSets = validateNonNegativeInt(o.plannedSets);
  if (completedSets === null || failedSets === null || plannedSets === null) return null;
  if (plannedSets > 0 && completedSets + failedSets > plannedSets) return null;
  if (failedSets > plannedSets) return null;

  return {
    label,
    status: o.status as ExerciseReviewStatus,
    completedSets,
    failedSets,
    plannedSets,
  };
}

function validateExercises(value: unknown): ExerciseReviewItem[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_EXERCISES) return null;
  const items: ExerciseReviewItem[] = [];
  for (const entry of value) {
    const item = validateExerciseItem(entry);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

function validateMetrics(body: Record<string, unknown>): SessionReviewMetrics | null {
  const routineName = validateRoutineName(body.routineName);
  const completedSets = validateNonNegativeInt(body.completedSets);
  const failedSets = validateNonNegativeInt(body.failedSets);
  const totalPlannedSets = validateNonNegativeInt(body.totalPlannedSets);
  const qualityTone = validateQualityTone(body.qualityTone);
  const sessionOutcome = validateSessionOutcome(body.sessionOutcome);
  const maxFailedInOneExercise = validateNonNegativeInt(body.maxFailedInOneExercise);
  const exercises = validateExercises(body.exercises);

  if (
    routineName === null ||
    completedSets === null ||
    failedSets === null ||
    totalPlannedSets === null ||
    qualityTone === null ||
    sessionOutcome === null ||
    maxFailedInOneExercise === null ||
    exercises === null
  ) {
    return null;
  }

  if (totalPlannedSets > 0 && completedSets + failedSets > totalPlannedSets) {
    return null;
  }

  if (maxFailedInOneExercise > failedSets) {
    return null;
  }

  return {
    routineName,
    completedSets,
    failedSets,
    totalPlannedSets,
    qualityTone,
    sessionOutcome,
    maxFailedInOneExercise,
    exercises,
  };
}

export async function POST(request: Request) {
  const guardResult = await applyRouteGuard(request);
  if (isNextResponse(guardResult)) {
    return guardResult;
  }

  const motivationAccess = requireTitanMotivationAccess(guardResult);
  if (motivationAccess) {
    return motivationAccess;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const userName = validateUserName(record.userName);

  if (!userName) {
    return NextResponse.json({ error: 'userName es obligatorio (1–80 caracteres)' }, { status: 400 });
  }

  const metrics = validateMetrics(record);
  if (!metrics) {
    return NextResponse.json({ error: 'Métricas de sesión inválidas' }, { status: 400 });
  }

  try {
    const payload = await generateTitanSessionReview(userName, metrics);
    return NextResponse.json({ ...payload, source: 'ollama' }, { status: 200 });
  } catch (err) {
    if (err instanceof OllamaUnavailableError || err instanceof OllamaParseError) {
      const fallback = pickSessionReviewFallback({
        userName,
        ...metrics,
      });
      return NextResponse.json(
        {
          usuario: userName,
          tono: fallback.mood,
          resumen: fallback.frase,
          fallos: [],
          ajustes: [],
          destacados: [],
          recomendaciones: [],
          source: 'fallback',
        },
        { status: 200 },
      );
    }
    const fallback = pickSessionReviewFallback({
      userName,
      ...metrics,
    });
    return NextResponse.json(
      {
        usuario: userName,
        tono: fallback.mood,
        resumen: fallback.frase,
        fallos: [],
        ajustes: [],
        destacados: [],
        recomendaciones: [],
        source: 'fallback',
      },
      { status: 200 },
    );
  }
}
