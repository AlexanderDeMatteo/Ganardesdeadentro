export const OLLAMA_MODEL = 'granite4.1:3b';

import type { ExerciseSectionLines } from '@/lib/coach/session-review-sections';
import type { SessionReviewMetrics, TitanNutritionMessage } from '@/lib/ollama/types';

export const TITAN_SYSTEM =
  "Eres 'Titan', la mascota virtual de Be a Gainer (un coach personalizado). Eres un entrenador rudo, motivador y experto en nutrición. Tu lenguaje es de gimnasio. Responde SIEMPRE en formato JSON estricto.";

export function buildMotivationPrompt(userName: string, context?: string): string {
  const seed = Date.now();
  const contextLine = context?.trim()
    ? ` Contexto de la app: el usuario está en la sección "${context.trim()}".`
    : '';

  return (
    `El usuario se llama ${userName} y necesita UNA frase motivacional breve para mantenerse enfocado.${contextLine} ` +
    `Genera contenido nuevo (semilla ${seed}). Devuelve la respuesta estrictamente con esta estructura: ` +
    `{"usuario": "${userName}", "frase": "tu frase aquí"}`
  );
}

function formatSectionList(title: string, items: string[]): string {
  if (items.length === 0) return `${title} (ninguno)`;
  return `${title}\n${items.map((l) => `  - ${l}`).join('\n')}`;
}

export function buildSessionReviewPrompt(
  userName: string,
  metrics: SessionReviewMetrics,
  sections: ExerciseSectionLines,
): string {
  const seed = Date.now();
  const outcomeLabel =
    metrics.sessionOutcome === 'completed' ? 'sesión completada al 100%' : 'sesión con series fallidas';

  const listsBlock = [
    formatSectionList('Fallos ya registrados por la app', sections.fallos),
    formatSectionList('Ajustes (1 Me rindo)', sections.ajustes),
    formatSectionList('Destacados (todo completado)', sections.destacados),
  ].join('\n\n');

  return (
    `El usuario ${userName} terminó "${metrics.routineName}". ${outcomeLabel}. ` +
    `Totales: ${metrics.completedSets} OK, ${metrics.failedSets} Me rindo, ${metrics.totalPlannedSets} planificadas. ` +
    `Calidad: ${metrics.qualityTone}.\n\n` +
    `LISTAS FIJAS (no las reescribas ni repitas en tu JSON):\n${listsBlock}\n\n` +
    `Genera SOLO resumen honesto y recomendaciones NUEVAS (semilla ${seed}). ` +
    `No inventes ejercicios. No repitas lo ya listado. No uses corchetes vacíos. ` +
    `Resumen: max 2 oraciones, tono acorde a fallos/ajustes. ` +
    `Recomendaciones: 1 a 3 consejos concretos (carga %, descanso, respiración, orden del día). ` +
    `JSON estricto:\n` +
    `{"resumen":"texto","recomendaciones":["consejo1","consejo2"],"tono":"celebrating"|"speaking"|"warning"}`
  );
}

function formatNutritionMessages(messages: TitanNutritionMessage[]): string {
  return messages
    .map((msg) => `${msg.role === 'assistant' ? 'Titan' : 'Usuario'}: ${msg.content}`)
    .join('\n');
}

export function buildNutritionTurnPrompt(
  messages: TitanNutritionMessage[],
  todayContext?: { consumedCalories?: number | null; targetCalories?: number | null; date?: string },
): string {
  const consumed = todayContext?.consumedCalories ?? null;
  const target = todayContext?.targetCalories ?? null;
  const date = todayContext?.date ?? 'hoy';
  const contextLine =
    consumed != null && target != null
      ? `Contexto diario (${date}): consumidas ${consumed} kcal de objetivo ${target} kcal.`
      : consumed != null
        ? `Contexto diario (${date}): consumidas ${consumed} kcal.`
        : `Contexto diario (${date}): sin objetivo cargado.`;

  return (
    `${contextLine}\n` +
    `Actúa como Titan, entrenador cercano y breve de Be a Gainer. ` +
    `Debes ayudar al usuario a estimar calorías de una comida con seguridad y sin exagerar precisión.\n\n` +
    `Reglas:\n` +
    `1) Responde SOLO JSON válido.\n` +
    `2) Si faltan cantidades clave, usa "status":"needs_info", haz una sola pregunta concreta y sugiere quickReplies.\n` +
    `3) Si hay suficiente información, usa "status":"estimate_ready" y entrega estimate con items, totalCalories, confidence y assumptions.\n` +
    `4) Si el usuario dice "no sé" o "estimar rápido", asume porción normal y confidence baja/media.\n` +
    `5) No des recomendaciones médicas.\n` +
    `6) Limita quickReplies a 5 opciones cortas.\n` +
    `7) confidence solo puede ser "low" | "medium" | "high".\n\n` +
    `Historial:\n${formatNutritionMessages(messages)}\n\n` +
    `8) En estimate.items debes incluir SIEMPRE macros por alimento: proteinG, carbsG, fatG (en gramos). quantityG es opcional.\n` +
    `9) Evita texto fuera del JSON.\n\n` +
    `Formato de salida obligatorio:\n` +
    `{"status":"needs_info"|"estimate_ready","message":"texto breve","quickReplies":["op1","op2"],"estimate":{"items":[{"name":"alimento","quantity":"cantidad","quantityG":180,"calories":120,"proteinG":10,"carbsG":8,"fatG":4}],"totalCalories":520,"confidence":"medium","assumptions":["supuesto 1"]} | null}`
  );
}
