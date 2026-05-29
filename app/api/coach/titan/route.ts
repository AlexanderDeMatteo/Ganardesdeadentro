import { NextResponse } from 'next/server';
import { applyRouteGuard } from '@/lib/api/titan-route-guard';
import { generateTitanMotivation } from '@/lib/ollama/client';
import { OllamaParseError, OllamaUnavailableError } from '@/lib/ollama/types';

const MAX_USER_NAME_LENGTH = 80;
const MAX_CONTEXT_LENGTH = 120;
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/;

function validateUserName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_USER_NAME_LENGTH) return null;
  if (CONTROL_CHAR_REGEX.test(trimmed)) return null;
  return trimmed;
}

function validateContext(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > MAX_CONTEXT_LENGTH) return undefined;
  if (CONTROL_CHAR_REGEX.test(trimmed)) return undefined;
  return trimmed;
}

export async function POST(request: Request) {
  const guardResponse = applyRouteGuard(request);
  if (guardResponse) {
    return guardResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  const userName =
    body !== null &&
    typeof body === 'object' &&
    'userName' in body
      ? validateUserName((body as { userName: unknown }).userName)
      : null;

  if (!userName) {
    return NextResponse.json({ error: 'userName es obligatorio (1–80 caracteres)' }, { status: 400 });
  }

  const context =
    body !== null && typeof body === 'object' && 'context' in body
      ? validateContext((body as { context: unknown }).context)
      : undefined;

  try {
    const payload = await generateTitanMotivation(userName, context);
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    if (err instanceof OllamaUnavailableError || err instanceof OllamaParseError) {
      return NextResponse.json(
        { error: 'Coach no disponible en este momento' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Coach no disponible en este momento' },
      { status: 503 },
    );
  }
}
