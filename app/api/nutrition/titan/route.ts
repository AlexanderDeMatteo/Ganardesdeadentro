import { NextResponse } from 'next/server';
import {
  applyRouteGuard,
  isNextResponse,
  requireTitanNutritionAccess,
} from '@/lib/api/titan-route-guard';
import { generateTitanNutritionTurn } from '@/lib/ollama/client';
import { OllamaParseError, OllamaUnavailableError, type TitanNutritionMessage } from '@/lib/ollama/types';

const MAX_MESSAGES = 6;
const MAX_CONTENT_LENGTH = 220;
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/;

function isValidRole(value: unknown): value is TitanNutritionMessage['role'] {
  return value === 'assistant' || value === 'user';
}

function sanitizeMessage(value: unknown): TitanNutritionMessage | null {
  if (typeof value !== 'object' || value === null) return null;
  const role = (value as { role?: unknown }).role;
  const content = (value as { content?: unknown }).content;
  if (!isValidRole(role) || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > MAX_CONTENT_LENGTH || CONTROL_CHAR_REGEX.test(trimmed)) return null;
  return { role, content: trimmed };
}

function sanitizeMessages(value: unknown): TitanNutritionMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const limited = value.slice(-MAX_MESSAGES);
  const sanitized = limited.map(sanitizeMessage);
  if (sanitized.some((msg) => msg == null)) return null;
  return sanitized as TitanNutritionMessage[];
}

function sanitizeOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value < 0 || value > 10000) return undefined;
  return Math.round(value);
}

function sanitizeDate(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 30 || CONTROL_CHAR_REGEX.test(trimmed)) return undefined;
  return trimmed;
}

function buildNutritionServerFallback() {
  return {
    status: 'needs_info' as const,
    message: 'Titan no está disponible ahora. Registra la comida manualmente en el diario.',
    quickReplies: ['Registrar manualmente', 'Estimar después'],
    estimate: null,
    source: 'fallback' as const,
  };
}

export async function POST(request: Request) {
  const guardResult = await applyRouteGuard(request);
  if (isNextResponse(guardResult)) {
    return guardResult;
  }

  const accessResponse = requireTitanNutritionAccess(guardResult);
  if (accessResponse) {
    return accessResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const messages = sanitizeMessages((body as { messages?: unknown }).messages);
  if (!messages) {
    return NextResponse.json({ error: 'messages es obligatorio (1-6 turnos válidos)' }, { status: 400 });
  }

  const todayContext = (body as { todayContext?: unknown }).todayContext;
  const consumedCalories = sanitizeOptionalNumber(
    typeof todayContext === 'object' && todayContext !== null
      ? (todayContext as { consumedCalories?: unknown }).consumedCalories
      : undefined,
  );
  const targetCalories = sanitizeOptionalNumber(
    typeof todayContext === 'object' && todayContext !== null
      ? (todayContext as { targetCalories?: unknown }).targetCalories
      : undefined,
  );
  const date = sanitizeDate(
    typeof todayContext === 'object' && todayContext !== null
      ? (todayContext as { date?: unknown }).date
      : undefined,
  );

  if (todayContext !== undefined && (consumedCalories === undefined || targetCalories === undefined)) {
    return NextResponse.json(
      { error: 'todayContext inválido: consumedCalories/targetCalories deben ser números válidos o null' },
      { status: 400 },
    );
  }

  try {
    const payload = await generateTitanNutritionTurn(messages, {
      consumedCalories,
      targetCalories,
      date,
    });
    return NextResponse.json({ ...payload, source: 'ollama' }, { status: 200 });
  } catch (err) {
    if (err instanceof OllamaUnavailableError || err instanceof OllamaParseError) {
      return NextResponse.json(buildNutritionServerFallback(), { status: 200 });
    }
    return NextResponse.json(buildNutritionServerFallback(), { status: 200 });
  }
}
