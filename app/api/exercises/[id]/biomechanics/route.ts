import { NextResponse } from 'next/server';

import { EXERCISE_DATASET } from '@/lib/biomechanics/exercise-dataset';

const ID_REGEX = /^[a-z0-9_-]{1,64}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Identificador de ejercicio inválido' }, { status: 400 });
  }

  const data = EXERCISE_DATASET[id];
  if (!data) {
    return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}
