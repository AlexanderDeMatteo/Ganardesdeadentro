/**
 * Cliente Ollama (solo servidor).
 * Requisitos locales: `ollama serve` y `ollama pull granite4.1:3b`
 * Variable opcional: OLLAMA_BASE_URL (default http://localhost:11434)
 * En Docker para el frontend: http://host.docker.internal:11434
 */

import { buildExerciseSectionLines } from '@/lib/coach/session-review-sections';
import { mergeSessionReview, sanitizeLlmLine, sanitizeLlmLines } from '@/lib/coach/session-review-merge';
import {
  buildNutritionTurnPrompt,
  buildMotivationPrompt,
  buildSessionReviewPrompt,
  OLLAMA_MODEL,
  TITAN_SYSTEM,
} from '@/lib/ollama/prompts';
import {
  OllamaGenerateRaw,
  OllamaParseError,
  OllamaUnavailableError,
  type SessionReviewMetrics,
  type TitanCoachMood,
  type TitanMotivationPayload,
  type TitanNutritionEstimate,
  type TitanNutritionEstimateItem,
  type TitanNutritionMessage,
  type TitanNutritionTurnPayload,
  type TitanSessionReviewLlmPayload,
  type TitanSessionReviewPayload,
} from '@/lib/ollama/types';

const VALID_TITAN_MOODS: TitanCoachMood[] = ['celebrating', 'speaking', 'warning'];

const DEFAULT_OLLAMA_BASE = 'http://localhost:11434';
const REQUEST_TIMEOUT_MS = 60_000;

function getGenerateUrl(): string {
  const base = (process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE).replace(/\/$/, '');
  return `${base}/api/generate`;
}

export function parseTitanMotivationPayload(raw: string): TitanMotivationPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OllamaParseError();
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('usuario' in parsed) ||
    !('frase' in parsed) ||
    typeof (parsed as TitanMotivationPayload).usuario !== 'string' ||
    typeof (parsed as TitanMotivationPayload).frase !== 'string' ||
    !(parsed as TitanMotivationPayload).frase.trim()
  ) {
    throw new OllamaParseError();
  }

  return parsed as TitanMotivationPayload;
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();
    if (trimmed.length > 0 && trimmed.length <= 280) {
      out.push(trimmed);
    }
  }
  if (out.length > 8) return null;
  return out;
}

export function parseTitanSessionReviewLlmPayload(raw: string): TitanSessionReviewLlmPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OllamaParseError();
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new OllamaParseError();
  }

  const obj = parsed as Record<string, unknown>;
  const resumenRaw = typeof obj.resumen === 'string' ? obj.resumen : '';
  const resumen = sanitizeLlmLine(resumenRaw);
  const recomendaciones = parseStringArray(obj.recomendaciones);
  const sanitizedRecs = recomendaciones ? sanitizeLlmLines(recomendaciones) : [];

  if (!resumen && sanitizedRecs.length === 0) {
    throw new OllamaParseError();
  }

  const tono =
    typeof obj.tono === 'string' && VALID_TITAN_MOODS.includes(obj.tono as TitanCoachMood)
      ? (obj.tono as TitanCoachMood)
      : undefined;

  return {
    resumen: resumen ?? 'Sesion registrada.',
    recomendaciones: sanitizedRecs,
    tono,
  };
}

function clampCalories(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5000) return null;
  return rounded;
}

function clampMacro(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  if (rounded < 0 || rounded > 400) return null;
  return rounded;
}

function clampQuantityG(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 2000) return undefined;
  return rounded;
}

function parseNutritionEstimateItems(value: unknown): TitanNutritionEstimateItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const items: TitanNutritionEstimateItem[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const obj = item as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    const quantity = typeof obj.quantity === 'string' ? obj.quantity.trim() : '';
    let calories = clampCalories(obj.calories);
    const proteinG = clampMacro(obj.proteinG);
    const carbsG = clampMacro(obj.carbsG);
    const fatG = clampMacro(obj.fatG);
    const quantityG = clampQuantityG(obj.quantityG);
    if (
      !name ||
      name.length > 80 ||
      !quantity ||
      quantity.length > 80 ||
      calories == null ||
      proteinG == null ||
      carbsG == null ||
      fatG == null
    ) {
      return null;
    }
    const kcalFromMacros = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
    if (Math.abs(kcalFromMacros - calories) > 220) {
      calories = Math.max(1, Math.min(5000, kcalFromMacros));
    }
    items.push({ name, quantity, quantityG, calories, proteinG, carbsG, fatG });
  }
  return items;
}

function parseNutritionEstimate(value: unknown): TitanNutritionEstimate | null {
  if (typeof value !== 'object' || value === null) return null;
  const obj = value as Record<string, unknown>;
  const items = parseNutritionEstimateItems(obj.items);
  const totalCalories = clampCalories(obj.totalCalories);
  const confidenceRaw = typeof obj.confidence === 'string' ? obj.confidence : '';
  const confidence: TitanNutritionEstimate['confidence'] | null =
    confidenceRaw === 'low' || confidenceRaw === 'medium' || confidenceRaw === 'high'
      ? confidenceRaw
      : null;
  const assumptionsRaw = parseStringArray(obj.assumptions) ?? [];
  const assumptions = assumptionsRaw.slice(0, 6);
  if (!items || totalCalories == null || !confidence) return null;
  return {
    items,
    totalCalories,
    confidence,
    assumptions,
  };
}

function normalizeQuickReplies(value: unknown): string[] {
  return (parseStringArray(value) ?? [])
    .map((reply) => reply.replace(/^OP\d+\s*:\s*/i, '').trim())
    .filter((reply) => reply.length >= 2 && reply.length <= 70)
    .slice(0, 3);
}

export function parseTitanNutritionTurnPayload(raw: string): TitanNutritionTurnPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OllamaParseError();
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new OllamaParseError();
  }

  const obj = parsed as Record<string, unknown>;
  const statusRaw = typeof obj.status === 'string' ? obj.status : '';
  const status: TitanNutritionTurnPayload['status'] | null =
    statusRaw === 'needs_info' || statusRaw === 'estimate_ready' ? statusRaw : null;
  const message = typeof obj.message === 'string' ? obj.message.trim() : '';
  const quickReplies = normalizeQuickReplies(obj.quickReplies);
  const estimate = obj.estimate === null ? null : parseNutritionEstimate(obj.estimate);

  if (!status || message.length < 2 || message.length > 280) {
    throw new OllamaParseError();
  }
  if (status === 'estimate_ready' && estimate == null) {
    throw new OllamaParseError();
  }
  if (status === 'needs_info' && estimate != null) {
    throw new OllamaParseError();
  }

  return {
    status,
    message,
    quickReplies,
    estimate,
  };
}

async function callOllamaGenerate(system: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(getGenerateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system,
        prompt,
        format: 'json',
        stream: false,
        options: { temperature: 0.85, num_predict: 512 },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new OllamaUnavailableError(`Ollama respondió ${res.status}`);
    }

    const data = (await res.json()) as OllamaGenerateRaw;

    if (!data.response?.trim()) {
      throw new OllamaParseError(data.error ?? 'Respuesta vacía');
    }

    return data.response;
  } catch (err) {
    if (err instanceof OllamaParseError || err instanceof OllamaUnavailableError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OllamaUnavailableError('Tiempo de espera agotado al contactar Ollama.');
    }
    throw new OllamaUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateTitanMotivation(
  userName: string,
  context?: string,
): Promise<TitanMotivationPayload> {
  const response = await callOllamaGenerate(TITAN_SYSTEM, buildMotivationPrompt(userName, context));
  return parseTitanMotivationPayload(response);
}

export async function generateTitanSessionReview(
  userName: string,
  metrics: SessionReviewMetrics,
): Promise<TitanSessionReviewPayload> {
  const sections = buildExerciseSectionLines(metrics.exercises);
  const response = await callOllamaGenerate(
    TITAN_SYSTEM,
    buildSessionReviewPrompt(userName, metrics, sections),
  );
  const llm = parseTitanSessionReviewLlmPayload(response);
  return mergeSessionReview(userName, metrics, llm);
}

export async function generateTitanNutritionTurn(
  messages: TitanNutritionMessage[],
  todayContext?: { consumedCalories?: number | null; targetCalories?: number | null; date?: string },
): Promise<TitanNutritionTurnPayload> {
  const response = await callOllamaGenerate(TITAN_SYSTEM, buildNutritionTurnPrompt(messages, todayContext));
  return parseTitanNutritionTurnPayload(response);
}
