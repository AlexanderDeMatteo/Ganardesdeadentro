export type TitanMotivationPayload = {
  usuario: string;
  frase: string;
};

export type TitanNutritionRole = 'user' | 'assistant';

export type TitanNutritionMessage = {
  role: TitanNutritionRole;
  content: string;
};

export type TitanNutritionEstimateItem = {
  name: string;
  quantity: string;
  quantityG?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type TitanNutritionEstimate = {
  items: TitanNutritionEstimateItem[];
  totalCalories: number;
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
};

export type TitanNutritionTurnPayload = {
  status: 'needs_info' | 'estimate_ready';
  message: string;
  quickReplies: string[];
  estimate: TitanNutritionEstimate | null;
};

export type SessionQualityTone = 'success' | 'warning' | 'danger' | 'neutral';

export type SessionOutcome = 'completed' | 'abandoned';

export type TitanCoachMood = 'celebrating' | 'speaking' | 'warning';

import type { ExerciseReviewItem } from '@/lib/coach/exercise-review';

export type { ExerciseReviewItem } from '@/lib/coach/exercise-review';

export type SessionReviewMetrics = {
  routineName: string;
  completedSets: number;
  failedSets: number;
  totalPlannedSets: number;
  qualityTone: SessionQualityTone;
  sessionOutcome: SessionOutcome;
  maxFailedInOneExercise: number;
  exercises: ExerciseReviewItem[];
};

/** Respuesta cruda de Ollama (solo resumen + recomendaciones). */
export type TitanSessionReviewLlmPayload = {
  resumen: string;
  recomendaciones: string[];
  tono?: TitanCoachMood;
};

export type TitanSessionReviewPayload = {
  usuario: string;
  tono: TitanCoachMood;
  resumen: string;
  fallos: string[];
  ajustes: string[];
  destacados: string[];
  recomendaciones: string[];
};

export type OllamaGenerateRaw = {
  model?: string;
  created_at?: string;
  response?: string;
  done?: boolean;
  error?: string;
};

export class OllamaUnavailableError extends Error {
  constructor(message = 'Ollama no está disponible. ¿Está corriendo `ollama serve`?') {
    super(message);
    this.name = 'OllamaUnavailableError';
  }
}

export class OllamaParseError extends Error {
  constructor(message = 'No se pudo interpretar la respuesta de Ollama.') {
    super(message);
    this.name = 'OllamaParseError';
  }
}
