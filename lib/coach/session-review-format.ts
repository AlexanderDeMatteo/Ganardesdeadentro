import type { TitanSessionReviewPayload } from '@/lib/ollama/types';

function bulletLines(title: string, items: string[]): string | null {
  if (items.length === 0) return null;
  return `${title}\n${items.map((line) => `• ${line}`).join('\n')}`;
}

/** Texto plano para el globo de Titan (typewriter + lectores de pantalla). */
export function formatSessionReviewForDisplay(review: TitanSessionReviewPayload): string {
  const parts: string[] = [];
  if (review.resumen?.trim()) {
    parts.push(review.resumen.trim());
  }
  const fallos = bulletLines('Donde fallaste:', review.fallos ?? []);
  const ajustes = bulletLines('Con un tropiezo:', review.ajustes ?? []);
  const destacados = bulletLines('Lo hiciste excelente:', review.destacados ?? []);
  const recomendaciones = bulletLines('Recomendaciones:', review.recomendaciones ?? []);
  if (fallos) parts.push(fallos);
  if (ajustes) parts.push(ajustes);
  if (destacados) parts.push(destacados);
  if (recomendaciones) parts.push(recomendaciones);

  return parts.join('\n\n') || 'Sesion registrada. Sigue entrenando con cabeza.';
}
