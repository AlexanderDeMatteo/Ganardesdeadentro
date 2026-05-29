'use client';

import { useAuth } from '@/app/context/auth-context';
import { useNutrition } from '@/hooks/use-nutrition';
import { hasTitanMotivationAccess } from '@/lib/auth/titan';
import { formatSessionReviewForDisplay } from '@/lib/coach/session-review-format';
import { pickSessionReviewFallback } from '@/lib/coach/session-review-fallback';
import { deriveCoachMoodFromExercises } from '@/lib/coach/session-review-sections';
import { pickTitanFallbackPhrase } from '@/lib/coach/titan-fallback-phrases';
import {
  getTitanAuthHeaders,
  getTitanMembershipPayload,
} from '@/lib/api/titan-client-headers';
import type { CoachMood, CoachTip, SessionReviewRequest } from '@/lib/coach/types';
import type {
  TitanMotivationPayload,
  TitanNutritionEstimate,
  TitanNutritionMessage,
  TitanNutritionTurnPayload,
  TitanSessionReviewPayload,
} from '@/lib/ollama/types';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const COACH_DISMISSED_KEY = 'fittrack.coach.dismissed';
const TITAN_COOLDOWN_MS = 20_000;
const TITAN_DEBOUNCE_MS = 400;
const SESSION_REVIEW_LOCK_MS = 120_000;

const tipsByRoute: Array<{ match: RegExp; tip: CoachTip }> = [
  {
    match: /^\/login/,
    tip: {
      eyebrow: 'Coach listo',
      message: 'Entra a la arena y retomemos tu transformacion.',
      actionLabel: 'Iniciar',
      actionHref: '/login',
      mood: 'speaking',
    },
  },
  {
    match: /^\/register/,
    tip: {
      eyebrow: 'Nuevo retador',
      message: 'Crea tu cuenta y empieza con una meta clara desde hoy.',
      actionLabel: 'Crear cuenta',
      actionHref: '/register',
      mood: 'celebrating',
    },
  },
  {
    match: /^\/dashboard/,
    tip: {
      eyebrow: 'Mision diaria',
      message: 'Revisa tus objetivos, elige tu proximo entrenamiento y conserva la racha.',
      actionLabel: 'Ver rutinas',
      actionHref: '/routines',
      mood: 'speaking',
    },
  },
  {
    match: /^\/routines/,
    tip: {
      eyebrow: 'Plan de combate',
      message: 'Selecciona una rutina que puedas completar hoy. La constancia gana.',
      actionLabel: 'Medir progreso',
      actionHref: '/metrics',
      mood: 'idle',
    },
  },
  {
    match: /^\/metrics/,
    tip: {
      eyebrow: 'Datos de campeon',
      message: 'Registra tus medidas con calma. Tus numeros cuentan la historia real.',
      mood: 'speaking',
    },
  },
  {
    match: /^\/nutrition/,
    tip: {
      eyebrow: 'Combustible',
      message: 'Calcula tus macros y alinea tu plan con tu objetivo. Sin gasolina no hay motor.',
      actionLabel: 'Ver macros',
      actionHref: '/nutrition',
      mood: 'speaking',
    },
  },
  {
    match: /^\/memberships/,
    tip: {
      eyebrow: 'Acceso elite',
      message: 'Elige el plan que sostenga tu ritmo sin perder funciones clave.',
      mood: 'warning',
    },
  },
  {
    match: /^\/admin/,
    tip: {
      eyebrow: 'Centro de control',
      message: 'Gestiona contenido y atletas manteniendo la experiencia clara.',
      mood: 'idle',
    },
  },
];

const fallbackTip: CoachTip = {
  eyebrow: 'Tu coach',
  message: 'Estoy aqui para ayudarte a mantener el foco en tu progreso.',
  actionLabel: 'Ir al dashboard',
  actionHref: '/dashboard',
  mood: 'idle',
};

type CoachContextValue = {
  tip: CoachTip;
  coachMood: CoachMood;
  isMinimized: boolean;
  isTitanLoading: boolean;
  titanMessage: string | null;
  titanFetchId: number;
  titanSource: 'ollama' | 'fallback' | null;
  showTitanUi: boolean;
  isSessionReviewActive: boolean;
  isNutritionAssistantActive: boolean;
  nutritionMessages: TitanNutritionMessage[];
  nutritionEstimate: TitanNutritionEstimate | null;
  nutritionQuickReplies: string[];
  nutritionError: string | null;
  messageDisplayMode: 'typewriter';
  minimize: () => void;
  restore: () => void;
  requestSessionReview: (payload: SessionReviewRequest) => void;
  requestNutritionQuickEstimate: () => void;
  sendNutritionReply: (message: string) => void;
  confirmNutritionEstimate: () => void;
};

const CoachContext = createContext<CoachContextValue | null>(null);

export function CoachProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { getTodaySummary, logFoodItem, hasTitanNutritionAccess } = useNutrition();
  const [isMinimized, setIsMinimized] = useState(false);
  const [titanMessage, setTitanMessage] = useState<string | null>(null);
  const [titanSource, setTitanSource] = useState<'ollama' | 'fallback' | null>(null);
  const [isTitanLoading, setIsTitanLoading] = useState(false);
  const [titanFetchId, setTitanFetchId] = useState(0);
  const [coachMoodOverride, setCoachMoodOverride] = useState<CoachMood | null>(null);
  const [isSessionReviewActive, setIsSessionReviewActive] = useState(false);
  const [isNutritionAssistantActive, setIsNutritionAssistantActive] = useState(false);
  const [nutritionMessages, setNutritionMessages] = useState<TitanNutritionMessage[]>([]);
  const [nutritionTurn, setNutritionTurn] = useState<TitanNutritionTurnPayload | null>(null);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  const lastFetchAtRef = useRef(0);
  const pendingCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchInFlightRef = useRef(false);
  const lastMessageRef = useRef<string | null>(null);
  const lastNutritionQuestionRef = useRef<string | null>(null);
  const repeatedNutritionQuestionCountRef = useRef(0);
  const sessionReviewLockUntilRef = useRef(0);
  const isMinimizedRef = useRef(false);
  const isSessionReviewActiveRef = useRef(false);
  const isNutritionAssistantActiveRef = useRef(false);
  const userRef = useRef(user);
  const pathnameRef = useRef(pathname);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizeQuickReplies = useCallback((replies: string[]): string[] => {
    return replies
      .map((reply) => reply.replace(/^OP\d+\s*:\s*/i, '').trim())
      .filter((reply) => reply.length >= 2 && reply.length <= 70)
      .slice(0, 3);
  }, []);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    isSessionReviewActiveRef.current = isSessionReviewActive;
  }, [isSessionReviewActive]);

  useEffect(() => {
    isNutritionAssistantActiveRef.current = isNutritionAssistantActive;
  }, [isNutritionAssistantActive]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setIsMinimized(localStorage.getItem(COACH_DISMISSED_KEY) === 'true');
  }, []);

  const isSessionReviewLocked = useCallback(() => Date.now() < sessionReviewLockUntilRef.current, []);

  const clearPendingCooldown = useCallback(() => {
    if (pendingCooldownTimerRef.current) {
      clearTimeout(pendingCooldownTimerRef.current);
      pendingCooldownTimerRef.current = null;
    }
  }, []);

  const openCoachPanel = useCallback(() => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'false');
    setIsMinimized(false);
  }, []);

  const applyFallback = useCallback(() => {
    const phrase = pickTitanFallbackPhrase(lastMessageRef.current ?? undefined);
    lastMessageRef.current = phrase;
    setTitanMessage(phrase);
    setTitanSource('fallback');
    setCoachMoodOverride(null);
  }, []);

  const runFetch = useCallback(async () => {
    const currentUser = userRef.current;
    if (
      !isAuthenticated ||
      !currentUser ||
      fetchInFlightRef.current ||
      isSessionReviewLocked() ||
      isSessionReviewActiveRef.current ||
      isNutritionAssistantActiveRef.current
    ) {
      return;
    }

    const userName = currentUser.first_name?.trim() || 'Atleta';
    fetchInFlightRef.current = true;
    setTitanFetchId((id) => id + 1);
    setIsTitanLoading(true);
    setTitanMessage(null);
    setCoachMoodOverride(null);
    lastFetchAtRef.current = Date.now();

    try {
      const res = await fetch('/api/coach/titan', {
        method: 'POST',
        headers: getTitanAuthHeaders(),
        body: JSON.stringify({ userName, context: pathnameRef.current }),
      });

      if (!res.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Titan] Coach no disponible:', res.status);
        }
        applyFallback();
        return;
      }

      const data = (await res.json()) as TitanMotivationPayload;
      if (typeof data.frase === 'string' && data.frase.trim()) {
        const frase = data.frase.trim();
        lastMessageRef.current = frase;
        setTitanMessage(frase);
        setTitanSource('ollama');
      } else {
        applyFallback();
      }
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Titan] No se pudo contactar al coach');
      }
      applyFallback();
    } finally {
      fetchInFlightRef.current = false;
      setIsTitanLoading(false);
    }
  }, [isAuthenticated, applyFallback, isSessionReviewLocked]);

  const requestTitanPhrase = useCallback(
    (options?: { immediate?: boolean }) => {
      if (!isAuthenticated || !user || isSessionReviewLocked()) return;

      clearPendingCooldown();

      if (options?.immediate) {
        if (!fetchInFlightRef.current) {
          void runFetch();
        }
        return;
      }

      const elapsed = Date.now() - lastFetchAtRef.current;
      const canFetchNow = lastFetchAtRef.current === 0 || elapsed >= TITAN_COOLDOWN_MS;

      if (canFetchNow && !fetchInFlightRef.current) {
        void runFetch();
        return;
      }

      const remaining = TITAN_COOLDOWN_MS - elapsed;
      if (remaining <= 0) {
        void runFetch();
        return;
      }

      pendingCooldownTimerRef.current = setTimeout(() => {
        pendingCooldownTimerRef.current = null;
        void runFetch();
      }, remaining);
    },
    [isAuthenticated, user, runFetch, clearPendingCooldown, isSessionReviewLocked],
  );

  const requestSessionReview = useCallback(
    (payload: SessionReviewRequest) => {
      if (!isAuthenticated || !user) return;

      clearPendingCooldown();
      sessionReviewLockUntilRef.current = Date.now() + SESSION_REVIEW_LOCK_MS;
      setIsSessionReviewActive(true);

      if (isMinimizedRef.current) {
        openCoachPanel();
      }

      fetchInFlightRef.current = true;
      setTitanFetchId((id) => id + 1);
      setIsTitanLoading(true);
      setTitanMessage(null);
      lastFetchAtRef.current = Date.now();

      void (async () => {
        try {
          const res = await fetch('/api/coach/session-review', {
            method: 'POST',
            headers: getTitanAuthHeaders(),
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const { frase, mood } = pickSessionReviewFallback(payload);
            lastMessageRef.current = frase;
            setTitanMessage(frase);
            setTitanSource('fallback');
            setCoachMoodOverride(mood);
            return;
          }

          const data = (await res.json()) as TitanSessionReviewPayload;
          const frase = formatSessionReviewForDisplay(data);
          if (frase.trim()) {
            lastMessageRef.current = frase;
            setTitanMessage(frase);
            setTitanSource('ollama');
            setCoachMoodOverride(
              deriveCoachMoodFromExercises(
                payload.exercises,
                payload.qualityTone,
                payload.sessionOutcome,
              ),
            );
          } else {
            const { frase: fallbackFrase, mood } = pickSessionReviewFallback(payload);
            lastMessageRef.current = fallbackFrase;
            setTitanMessage(fallbackFrase);
            setTitanSource('fallback');
            setCoachMoodOverride(mood);
          }
        } catch {
          const { frase, mood } = pickSessionReviewFallback(payload);
          lastMessageRef.current = frase;
          setTitanMessage(frase);
          setTitanSource('fallback');
          setCoachMoodOverride(mood);
        } finally {
          fetchInFlightRef.current = false;
          setIsTitanLoading(false);
        }
      })();
    },
    [isAuthenticated, user, clearPendingCooldown, openCoachPanel],
  );

  const buildNutritionFallbackEstimate = useCallback((): TitanNutritionTurnPayload => {
    return {
      status: 'estimate_ready',
      message: 'Para no frenar tu registro, estimé una porción normal. Puedes ajustar luego.',
      quickReplies: [],
      estimate: {
        items: [
          {
            name: 'Comida mixta',
            quantity: 'porción normal',
            quantityG: 250,
            calories: 450,
            proteinG: 24,
            carbsG: 46,
            fatG: 16,
          },
        ],
        totalCalories: 450,
        confidence: 'low',
        assumptions: ['Estimación por porción normal debido a datos ambiguos o repetidos'],
      },
    };
  }, []);

  const runNutritionTurn = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || !isAuthenticated || !user || !hasTitanNutritionAccess || fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      setIsTitanLoading(true);
      setNutritionError(null);
      setIsNutritionAssistantActive(true);
      if (isMinimizedRef.current) {
        openCoachPanel();
      }

      const nextMessages: TitanNutritionMessage[] = [
        ...nutritionMessages,
        { role: 'user', content: trimmed },
      ];
      setNutritionMessages(nextMessages);

      const todaySummary = getTodaySummary();
      const displayDate = new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      try {
        const res = await fetch('/api/nutrition/titan', {
          method: 'POST',
          headers: getTitanAuthHeaders(),
          body: JSON.stringify({
            messages: nextMessages.slice(-6),
            todayContext: {
              consumedCalories: todaySummary.consumed.calories,
              targetCalories: todaySummary.targets?.calories ?? null,
              date: displayDate,
            },
            ...getTitanMembershipPayload(userRef.current),
          }),
        });

        if (!res.ok) {
          throw new Error('Titan nutricional no disponible');
        }

        let payload = (await res.json()) as TitanNutritionTurnPayload;
        payload = { ...payload, quickReplies: normalizeQuickReplies(payload.quickReplies ?? []) };

        if (payload.status === 'needs_info') {
          const sameQuestion =
            lastNutritionQuestionRef.current != null &&
            lastNutritionQuestionRef.current.toLowerCase() === payload.message.toLowerCase();
          if (sameQuestion) {
            repeatedNutritionQuestionCountRef.current += 1;
          } else {
            repeatedNutritionQuestionCountRef.current = 0;
          }
          lastNutritionQuestionRef.current = payload.message;
          if (repeatedNutritionQuestionCountRef.current >= 1) {
            payload = buildNutritionFallbackEstimate();
          }
        } else {
          repeatedNutritionQuestionCountRef.current = 0;
          lastNutritionQuestionRef.current = null;
        }

        setNutritionTurn(payload);
        setNutritionMessages((prev) => [...prev, { role: 'assistant', content: payload.message }]);
      } catch {
        setNutritionError('Titan no está disponible. Puedes registrar manualmente en el diario.');
      } finally {
        fetchInFlightRef.current = false;
        setIsTitanLoading(false);
      }
    },
    [
      isAuthenticated,
      user,
      hasTitanNutritionAccess,
      nutritionMessages,
      getTodaySummary,
      normalizeQuickReplies,
      openCoachPanel,
      buildNutritionFallbackEstimate,
    ],
  );

  const requestNutritionQuickEstimate = useCallback(() => {
    if (!hasTitanNutritionAccess) return;
    void runNutritionTurn('estimar rápido');
  }, [hasTitanNutritionAccess, runNutritionTurn]);

  const sendNutritionReply = useCallback(
    (message: string) => {
      if (!hasTitanNutritionAccess) return;
      void runNutritionTurn(message);
    },
    [hasTitanNutritionAccess, runNutritionTurn],
  );

  const confirmNutritionEstimate = useCallback(() => {
    if (!nutritionTurn?.estimate) return;
    nutritionTurn.estimate.items.forEach((item) => {
      logFoodItem({
        name: item.name,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        quantityG: item.quantityG,
      });
    });
    setIsNutritionAssistantActive(false);
    setNutritionTurn(null);
    setNutritionMessages([]);
    setNutritionError(null);
    setTitanFetchId((id) => id + 1);
    setTitanMessage(`Listo. Registré ${nutritionTurn.estimate.items.length} alimento(s) en tu diario.`);
    setTitanSource('ollama');
  }, [nutritionTurn, logFoodItem]);

  useEffect(() => {
    if (!isSessionReviewActive) return;
    const remaining = sessionReviewLockUntilRef.current - Date.now();
    if (remaining <= 0) {
      setIsSessionReviewActive(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSessionReviewActive(false);
      sessionReviewLockUntilRef.current = 0;
    }, remaining);
    return () => clearTimeout(timer);
  }, [isSessionReviewActive]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTitanMessage(null);
      setTitanSource(null);
      lastMessageRef.current = null;
      setIsTitanLoading(false);
      setCoachMoodOverride(null);
      setIsSessionReviewActive(false);
      setIsNutritionAssistantActive(false);
      setNutritionMessages([]);
      setNutritionTurn(null);
      setNutritionError(null);
      repeatedNutritionQuestionCountRef.current = 0;
      lastNutritionQuestionRef.current = null;
      return;
    }

    const debounceTimer = setTimeout(() => {
      requestTitanPhrase();
    }, TITAN_DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [pathname, isAuthenticated, user, requestTitanPhrase]);

  useEffect(() => {
    return () => {
      clearPendingCooldown();
    };
  }, [clearPendingCooldown]);

  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!isAuthenticated || !user || isMinimized || isNutritionAssistantActive) {
      return;
    }

    pollingIntervalRef.current = setInterval(() => {
      if (
        fetchInFlightRef.current ||
        isSessionReviewLocked() ||
        isSessionReviewActiveRef.current ||
        isNutritionAssistantActiveRef.current ||
        isMinimizedRef.current
      ) {
        return;
      }

      const elapsed = Date.now() - lastFetchAtRef.current;
      if (lastFetchAtRef.current > 0 && elapsed < TITAN_COOLDOWN_MS) {
        return;
      }

      void runFetch();
    }, TITAN_COOLDOWN_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- polling estable por user.id; datos en userRef
  }, [isAuthenticated, user?.id, isMinimized, isNutritionAssistantActive, runFetch, isSessionReviewLocked]);

  const baseTip = useMemo(() => {
    return tipsByRoute.find(({ match }) => match.test(pathname))?.tip ?? fallbackTip;
  }, [pathname]);

  const tip = useMemo(() => {
    if (!isAuthenticated) {
      return baseTip;
    }
    return {
      ...baseTip,
      eyebrow: 'Titan',
      message: '',
      mood: baseTip.mood === 'idle' ? 'speaking' : baseTip.mood,
    } satisfies CoachTip;
  }, [baseTip, isAuthenticated]);

  const coachMood: CoachMood = coachMoodOverride ?? tip.mood;

  const showTitanUi = hasTitanMotivationAccess(isAuthenticated);

  const minimize = () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    setIsMinimized(true);
    setIsSessionReviewActive(false);
    clearPendingCooldown();
  };

  const restore = () => {
    openCoachPanel();
    if (isNutritionAssistantActive) return;
    if (isSessionReviewLocked() && lastMessageRef.current) {
      setIsSessionReviewActive(true);
      return;
    }
    if (!isSessionReviewLocked()) {
      requestTitanPhrase({ immediate: true });
    }
  };

  const messageDisplayMode = 'typewriter' as const;

  const value: CoachContextValue = {
    tip,
    coachMood,
    isMinimized,
    isTitanLoading,
    titanMessage,
    titanFetchId,
    titanSource,
    showTitanUi,
    isSessionReviewActive,
    isNutritionAssistantActive,
    nutritionMessages,
    nutritionEstimate: nutritionTurn?.estimate ?? null,
    nutritionQuickReplies: nutritionTurn?.quickReplies ?? [],
    nutritionError,
    messageDisplayMode,
    minimize,
    restore,
    requestSessionReview,
    requestNutritionQuickEstimate,
    sendNutritionReply,
    confirmNutritionEstimate,
  };

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error('useCoach debe usarse dentro de CoachProvider');
  }
  return ctx;
}
