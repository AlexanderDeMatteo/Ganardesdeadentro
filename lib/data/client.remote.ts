import type { AdminDashboardMetricsResponse } from '@/lib/api/contracts/admin';
import { ApiError } from '@/lib/api/errors';
import { getApiBaseUrl } from '@/lib/api/config';
import { httpRequest } from '@/lib/api/http-client';
import type {
  ApiExerciseResponse,
  CreateExercisePayload,
  UpdateExercisePayload,
} from '@/lib/api/contracts/exercises';
import type { Membership } from '@/app/context/auth-context';
import type { MembershipPlan } from '@/hooks/use-memberships';
import type {
  Athlete,
  Difficulty,
  Exercise,
  Metric,
  Routine,
  RoutineAssignment,
  RoutineExercise,
  SessionLog,
  SetLogEntry,
  Trainer,
  WeeklyPlan,
  WeeklyPlanDay,
} from '@/lib/data/types';
import type { BodyProfile, BodyProfileResponse } from '@/lib/api/contracts/body-profile';
import type {
  DiaryEntryPostRequest,
  DiaryPutRequest,
  DiaryResponse,
  DiaryWaterPatchRequest,
} from '@/lib/api/contracts/nutrition-diary';
import type { AssignedNutritionPlan, AthleteDiaryState, CoachNutritionDraft } from '@/lib/nutrition/types';
import { normalizeMealPlan } from '@/lib/nutrition/normalize-meal-plan';
import { normalizeActivityLevel } from '@/lib/nutrition/activity-level';
import { getMondayOfWeek } from '@/lib/workout/session-utils';

type ApiMetricPayload = {
  id: string;
  athleteId: string;
  date: string;
  weight?: number | null;
  bodyFat?: number | null;
  bodyFatSource?: Metric['bodyFatSource'] | null;
  muscleMass?: number | null;
  muscleMassSource?: Metric['muscleMassSource'] | null;
  bicepsLeft?: number | null;
  bicepsRight?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  thighLeft?: number | null;
  thighRight?: number | null;
  calfLeft?: number | null;
  calfRight?: number | null;
  notes?: string | null;
};

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

function mapApiMetric(raw: ApiMetricPayload): Metric {
  return {
    id: raw.id,
    athleteId: raw.athleteId,
    date: raw.date,
    weight: nullToUndefined(raw.weight),
    bodyFat: nullToUndefined(raw.bodyFat),
    bodyFatSource: nullToUndefined(raw.bodyFatSource),
    muscleMass: nullToUndefined(raw.muscleMass),
    muscleMassSource: nullToUndefined(raw.muscleMassSource),
    bicepsLeft: nullToUndefined(raw.bicepsLeft),
    bicepsRight: nullToUndefined(raw.bicepsRight),
    chest: nullToUndefined(raw.chest),
    waist: nullToUndefined(raw.waist),
    hips: nullToUndefined(raw.hips),
    thighLeft: nullToUndefined(raw.thighLeft),
    thighRight: nullToUndefined(raw.thighRight),
    calfLeft: nullToUndefined(raw.calfLeft),
    calfRight: nullToUndefined(raw.calfRight),
    notes: nullToUndefined(raw.notes),
  };
}

type ApiRoutineExercisePayload = {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  rest: number;
  suggestedWeightsKg?: number[] | null;
  technique?: string | null;
  blockConfig?: RoutineExercise['blockConfig'] | null;
};

type ApiRoutinePayload = {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  structureType?: Routine['structureType'];
  exercises: ApiRoutineExercisePayload[];
  createdDate: string;
  trainerId?: string | null;
};

type ApiAssignmentPayload = {
  id: string;
  athleteId: string;
  routineId: string;
  trainerId: string;
  assignedDate: string;
  isActive: boolean;
};

type ApiSetLogPayload = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  repsTarget: string;
  repsLogged?: string | null;
  weightKg?: number | null;
  suggestedWeightKg?: number | null;
  result: SetLogEntry['result'];
  executionVideoUrl?: string | null;
  executionVideoUploadedAt?: string | null;
};

type ApiSessionPayload = {
  id: string;
  athleteId: string;
  routineId: string;
  assignmentId?: string | null;
  weekPlanId?: string | null;
  scheduledDate: string;
  date: string;
  setLogs: ApiSetLogPayload[];
  completed: boolean;
  completedSets: number;
  failedSets: number;
  totalSets: number;
  sessionOutcome: string;
};

type ApiWeeklyPlanPayload = {
  id: string;
  athleteId: string;
  trainerId: string;
  weekStartDate: string;
  days: WeeklyPlanDay[];
  createdAt: string;
  isActive: boolean;
};

function mapApiRoutineExercise(raw: ApiRoutineExercisePayload): RoutineExercise {
  return {
    exerciseId: raw.exerciseId,
    exerciseName: raw.exerciseName,
    sets: raw.sets,
    reps: raw.reps,
    rest: raw.rest,
    suggestedWeightsKg: nullToUndefined(raw.suggestedWeightsKg),
    technique: nullToUndefined(raw.technique),
    blockConfig: raw.blockConfig ?? undefined,
  };
}

function mapApiRoutine(raw: ApiRoutinePayload): Routine {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    difficulty: raw.difficulty,
    duration: raw.duration,
    structureType: raw.structureType ?? 'standard',
    exercises: raw.exercises.map(mapApiRoutineExercise),
    createdDate: raw.createdDate,
    trainerId: nullToUndefined(raw.trainerId),
  };
}

function mapApiAssignment(raw: ApiAssignmentPayload): RoutineAssignment {
  return {
    id: raw.id,
    athleteId: raw.athleteId,
    routineId: raw.routineId,
    trainerId: raw.trainerId,
    assignedDate: raw.assignedDate,
    isActive: raw.isActive,
  };
}

function mapApiSetLog(raw: ApiSetLogPayload): SetLogEntry {
  return {
    exerciseId: raw.exerciseId,
    exerciseName: raw.exerciseName,
    setNumber: raw.setNumber,
    repsTarget: raw.repsTarget,
    repsLogged: nullToUndefined(raw.repsLogged),
    weightKg: nullToUndefined(raw.weightKg),
    suggestedWeightKg: nullToUndefined(raw.suggestedWeightKg),
    result: raw.result,
    executionVideoUrl: resolveApiUrl(raw.executionVideoUrl),
    executionVideoUploadedAt: nullToUndefined(raw.executionVideoUploadedAt),
  };
}

function mapApiSessionOutcome(
  outcome: string,
): SessionLog['sessionOutcome'] {
  if (outcome === 'partial' || outcome === 'skipped') return 'abandoned';
  if (outcome === 'completed' || outcome === 'abandoned') {
    return outcome;
  }
  return 'abandoned';
}

function toApiSessionOutcome(outcome: SessionLog['sessionOutcome']): string {
  if (outcome === 'abandoned') return 'partial';
  return outcome;
}

function mapApiSession(raw: ApiSessionPayload): SessionLog {
  return {
    id: raw.id,
    athleteId: raw.athleteId,
    routineId: raw.routineId,
    assignmentId: nullToUndefined(raw.assignmentId),
    weekPlanId: nullToUndefined(raw.weekPlanId),
    scheduledDate: raw.scheduledDate,
    date: raw.date,
    setLogs: raw.setLogs.map(mapApiSetLog),
    completed: raw.completed,
    completedSets: raw.completedSets,
    failedSets: raw.failedSets,
    totalSets: raw.totalSets,
    sessionOutcome: mapApiSessionOutcome(raw.sessionOutcome),
  };
}

function mapApiWeeklyPlan(raw: ApiWeeklyPlanPayload): WeeklyPlan {
  return {
    id: raw.id,
    athleteId: raw.athleteId,
    trainerId: raw.trainerId,
    weekStartDate: raw.weekStartDate,
    days: raw.days,
    createdAt: raw.createdAt,
    isActive: raw.isActive,
  };
}

type ApiLatestMetricPayload = {
  weight?: number | null;
  bodyFat?: number | null;
  muscleMass?: number | null;
  date?: string | null;
};

type ApiAthletePayload = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  joinDate: string;
  trainerId?: string | null;
  membershipLevel: Athlete['membershipLevel'];
  membershipId?: string | null;
  latestMetric?: ApiLatestMetricPayload | null;
};

type ApiTrainerPayload = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  bio?: string | null;
  athletes: number;
  rating: number;
  joinDate: string;
  isActive?: boolean;
  invitePending?: boolean;
  maxAthletes?: number;
};

type ApiNutritionPlanPayload = {
  athleteId: string;
  macroTargets: AssignedNutritionPlan['macroTargets'];
  mealPlan: AssignedNutritionPlan['mealPlan'];
  slotTimes: AssignedNutritionPlan['slotTimes'];
  activityLevel: AssignedNutritionPlan['activityLevel'];
  goal: AssignedNutritionPlan['goal'];
  calorieAdjustment: number;
  publishedAt: string;
  publishedBy: string;
};

type ApiActiveMembershipPayload = {
  level: Athlete['membershipLevel'];
  planId: string;
  daysRemaining?: number;
};

type ApiMembershipPlanPayload = {
  id: string;
  name: string;
  functionalTier?: string;
  price: number;
  description: string;
  features: string[];
  durationDays: number;
  color: string;
  createdAt: string;
};

type AdminOverviewPayload = {
  trainerCount: number;
  athleteCount: number;
  assignmentCount: number;
  athletesWithoutTrainer: number;
  trainersWithoutAthletes: number;
};

type ApiExercisePayload = ApiExerciseResponse;

function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'beginner' || lower === 'intermediate' || lower === 'expert') {
      return lower;
    }
  }
  return 'beginner';
}

function resolveApiUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${getApiBaseUrl()}${url}`;
  return url;
}

function resolveAnimationUrl(url?: string | null): string | undefined {
  return resolveApiUrl(url);
}

function mapApiExercise(raw: ApiExercisePayload): Exercise {
  const externalId = raw.exercise_db_id ?? (raw.id != null ? String(raw.id) : '');
  const animationUrl = resolveAnimationUrl(raw.animation_url ?? raw.gif_url);
  let animationType = raw.animation_type ?? undefined;
  if (!animationType && animationUrl) {
    animationType = animationUrl.toLowerCase().includes('.mp4') ? 'video' : 'gif';
  }
  return {
    id: externalId,
    name: raw.name,
    targetMuscle: raw.target_muscle ?? raw.target ?? 'General',
    difficulty: normalizeDifficulty(raw.difficulty),
    equipment: raw.equipment ?? 'Ninguno',
    description: raw.description ?? undefined,
    animationUrl,
    animationType: animationType === 'none' ? undefined : animationType,
    animationSource: raw.animation_source ?? undefined,
    isCustom: raw.is_custom ?? false,
    createdById: raw.created_by_id ?? undefined,
  };
}

function mapLatestMetric(raw?: ApiLatestMetricPayload | null): Athlete['latestMetric'] | undefined {
  if (!raw) return undefined;
  return {
    weight: raw.weight ?? 0,
    bodyFat: raw.bodyFat ?? 0,
    muscleMass: raw.muscleMass ?? 0,
    date: raw.date ?? undefined,
  };
}

function mapApiAthlete(raw: ApiAthletePayload): Athlete {
  const latestMetric = mapLatestMetric(raw.latestMetric);
  const metrics = latestMetric
    ? { weight: latestMetric.weight, bodyFat: latestMetric.bodyFat, muscleMass: latestMetric.muscleMass }
    : undefined;
  return {
    id: raw.id,
    userId: raw.userId ?? raw.id,
    name: raw.name,
    email: raw.email,
    age: raw.age,
    gender: raw.gender,
    weight: raw.weight,
    height: raw.height,
    joinDate: raw.joinDate,
    trainerId: nullToUndefined(raw.trainerId),
    membershipLevel: raw.membershipLevel,
    membershipId: nullToUndefined(raw.membershipId),
    latestMetric,
    metrics,
  };
}

function mapApiTrainer(raw: ApiTrainerPayload): Trainer {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    specialization: raw.specialization,
    bio: nullToUndefined(raw.bio),
    athletes: raw.athletes,
    rating: raw.rating,
    joinDate: raw.joinDate,
    isActive: raw.isActive ?? true,
    invitePending: raw.invitePending ?? false,
    maxAthletes: raw.maxAthletes ?? 10,
  };
}

function normalizeFunctionalTier(value: unknown): MembershipPlan['functionalTier'] {
  if (value === 'premium' || value === 'pro' || value === 'basic') {
    return value;
  }
  return 'basic';
}

function mapApiMembershipPlan(raw: ApiMembershipPlanPayload): MembershipPlan {
  const color = raw.color as MembershipPlan['color'];
  return {
    id: raw.id,
    name: raw.name,
    functionalTier: normalizeFunctionalTier(raw.functionalTier),
    price: raw.price,
    description: raw.description,
    features: raw.features,
    durationDays: raw.durationDays,
    color,
    createdAt: raw.createdAt,
  };
}

function mapApiNutritionPlan(raw: ApiNutritionPlanPayload): AssignedNutritionPlan {
  return {
    athleteId: raw.athleteId,
    macroTargets: raw.macroTargets,
    mealPlan: normalizeMealPlan(raw.mealPlan),
    slotTimes: raw.slotTimes,
    activityLevel: raw.activityLevel,
    goal: raw.goal,
    calorieAdjustment: raw.calorieAdjustment,
    publishedAt: raw.publishedAt,
    publishedBy: raw.publishedBy,
  };
}

export function membershipLevelToPlanId(
  level: Athlete['membershipLevel'],
): string {
  switch (level) {
    case 'premium':
      return '2';
    case 'pro':
      return '3';
    default:
      return '1';
  }
}

export function membershipNameToPlanId(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'pro') return '3';
  if (normalized === 'premium') return '2';
  if (normalized === 'básica' || normalized === 'basica' || normalized === 'basic') return '1';
  return '1';
}

export async function getMyRoutine(athleteId: string): Promise<{
  assignment: RoutineAssignment | null;
  routine: Routine | null;
}> {
  const response = await httpRequest<{
    assignment: ApiAssignmentPayload | null;
    routine: ApiRoutinePayload | null;
  }>(`/api/routines/my?athleteId=${encodeURIComponent(athleteId)}`);
  return {
    assignment: response.assignment ? mapApiAssignment(response.assignment) : null,
    routine: response.routine ? mapApiRoutine(response.routine) : null,
  };
}

export async function getAthleteMetrics(athleteId: string): Promise<Metric[]> {
  const response = await httpRequest<{ metrics: ApiMetricPayload[] }>(
    `/api/metrics/?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return response.metrics.map(mapApiMetric);
}

export async function addMetric(
  athleteId: string,
  metric: Omit<Metric, 'id' | 'athleteId'>,
): Promise<Metric> {
  const response = await httpRequest<{ metric: ApiMetricPayload }>('/api/metrics/', {
    method: 'POST',
    body: { athleteId, ...metric },
  });
  return mapApiMetric(response.metric);
}

export async function updateMetric(
  id: string,
  patch: Partial<Omit<Metric, 'id' | 'athleteId'>>,
): Promise<Metric | null> {
  try {
    const response = await httpRequest<{ metric: ApiMetricPayload }>(
      `/api/metrics/${encodeURIComponent(id)}/`,
      {
        method: 'PATCH',
        body: patch,
      },
    );
    return mapApiMetric(response.metric);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function removeMetric(id: string): Promise<void> {
  await httpRequest(`/api/metrics/${encodeURIComponent(id)}/`, {
    method: 'DELETE',
  });
}

export async function getMealPlan(athleteId: string): Promise<AssignedNutritionPlan | null> {
  const response = await httpRequest<{ plan: ApiNutritionPlanPayload | null }>(
    `/api/nutrition/plan?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return response.plan ? mapApiNutritionPlan(response.plan) : null;
}

export async function markSessionComplete(
  athleteId: string,
  payload: Omit<SessionLog, 'id' | 'athleteId' | 'date'> & { date?: string },
): Promise<SessionLog> {
  const response = await httpRequest<{ session: ApiSessionPayload }>('/api/sessions/complete', {
    method: 'POST',
    body: {
      athleteId,
      ...payload,
      sessionOutcome: toApiSessionOutcome(payload.sessionOutcome),
    },
  });
  return mapApiSession(response.session);
}

export async function getAthleteSessionLogs(athleteId: string): Promise<SessionLog[]> {
  const response = await httpRequest<{ sessions: ApiSessionPayload[] }>(
    `/api/sessions/?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return response.sessions.map(mapApiSession);
}

export async function getSessionLogsForWeek(
  athleteId: string,
  weekStartDate?: string,
): Promise<SessionLog[]> {
  const weekStart = weekStartDate ?? getMondayOfWeek();
  const response = await httpRequest<{ sessions: ApiSessionPayload[] }>(
    `/api/sessions/week?athleteId=${encodeURIComponent(athleteId)}&weekStart=${encodeURIComponent(weekStart)}`,
  );
  return response.sessions.map(mapApiSession);
}

export async function getExerciseProgress(
  athleteId: string,
  exerciseId: string,
): Promise<Array<{ date: string; maxWeightKg: number; sessionId: string }>> {
  const response = await httpRequest<{
    progress: Array<{ date: string; maxWeightKg: number; sessionId: string }>;
  }>(
    `/api/sessions/progress?athleteId=${encodeURIComponent(athleteId)}&exerciseId=${encodeURIComponent(exerciseId)}`,
  );
  return response.progress;
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  try {
    const response = await httpRequest<{ routine: ApiRoutinePayload }>(
      `/api/routines/${encodeURIComponent(routineId)}`,
    );
    return mapApiRoutine(response.routine);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function listActiveWeeklyPlansForTrainer(trainerId: string): Promise<WeeklyPlan[]> {
  const response = await httpRequest<{ plans: ApiWeeklyPlanPayload[] }>(
    `/api/routines/weekly-plans/active?trainerId=${encodeURIComponent(trainerId)}`,
  );
  return response.plans.map(mapApiWeeklyPlan);
}

export async function getWeeklyPlan(athleteId: string): Promise<WeeklyPlan | null> {
  const response = await httpRequest<{ weeklyPlan: ApiWeeklyPlanPayload | null }>(
    `/api/routines/weekly-plan?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return response.weeklyPlan ? mapApiWeeklyPlan(response.weeklyPlan) : null;
}

export async function assignWeeklyPlan(
  athleteId: string,
  _trainerId: string,
  days: WeeklyPlanDay[],
  weekStartDate?: string,
): Promise<WeeklyPlan> {
  const response = await httpRequest<{ weeklyPlan: ApiWeeklyPlanPayload }>(
    '/api/routines/weekly-plan',
    {
      method: 'PUT',
      body: {
        athleteId,
        days,
        weekStartDate: weekStartDate ?? getMondayOfWeek(),
      },
    },
  );
  return mapApiWeeklyPlan(response.weeklyPlan);
}

export async function getMyTrainer(athleteId: string): Promise<Trainer | null> {
  const response = await httpRequest<{ trainer: ApiTrainerPayload | null }>(
    `/api/users/my-trainer?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return response.trainer ? mapApiTrainer(response.trainer) : null;
}

export async function getMembership(athleteId: string): Promise<{
  level: Athlete['membershipLevel'];
  planId: string;
} | null> {
  const response = await httpRequest<{ membership: ApiActiveMembershipPayload | null }>(
    `/api/memberships/active?athleteId=${encodeURIComponent(athleteId)}`,
  );
  if (!response.membership) return null;
  return {
    level: response.membership.level,
    planId: response.membership.planId,
  };
}

export async function subscribeMembership(planId: string): Promise<void> {
  await httpRequest('/api/memberships/subscribe', {
    method: 'POST',
    body: { planId: Number(planId) },
  });
}

export async function listPaymentMethods(): Promise<import('@/lib/api/contracts/payments').PaymentMethod[]> {
  const response = await httpRequest<{ methods: import('@/lib/api/contracts/payments').PaymentMethod[] }>(
    '/api/payments/methods',
    { auth: false },
  );
  return response.methods;
}

export async function listAllPaymentMethods(): Promise<import('@/lib/api/contracts/payments').PaymentMethod[]> {
  const response = await httpRequest<{ methods: import('@/lib/api/contracts/payments').PaymentMethod[] }>(
    '/api/payments/methods/all',
  );
  return response.methods;
}

export async function getPaymentMethodInstructions(methodId: string) {
  const response = await httpRequest<{ method: import('@/lib/api/contracts/payments').PaymentMethod }>(
    `/api/payments/methods/${encodeURIComponent(methodId)}/instructions`,
  );
  return response.method;
}

export async function createPaymentMethod(
  data: {
    name: string;
    category: string;
    instructions?: string;
    methodType: 'digital' | 'bank' | 'crypto' | 'cash';
    exchangeRateId: string | null;
    details: Array<{ key: string; value: string }>;
    sortOrder: number;
    isActive: boolean;
    slug?: string;
  },
) {
  const response = await httpRequest<{ method: import('@/lib/api/contracts/payments').PaymentMethod }>(
    '/api/payments/methods',
    { method: 'POST', body: data },
  );
  return response.method;
}

export async function updatePaymentMethod(
  id: string,
  data: Partial<import('@/lib/api/contracts/payments').PaymentMethod>,
) {
  const response = await httpRequest<{ method: import('@/lib/api/contracts/payments').PaymentMethod }>(
    `/api/payments/methods/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
  );
  return response.method;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await httpRequest(`/api/payments/methods/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function submitPaymentRequest(
  input: import('@/lib/api/contracts/payments').SubmitPaymentRequestInput,
): Promise<import('@/lib/api/contracts/payments').PaymentRequest> {
  const form = new FormData();
  form.append('planId', input.planId);
  form.append('paymentMethodId', input.paymentMethodId);
  form.append('fullName', input.fullName);
  form.append('phone', input.phone);
  form.append('country', input.country);
  if (input.sellerCode) form.append('sellerCode', input.sellerCode);
  form.append('email', input.email);
  if (input.amountUsd != null) form.append('amountUsd', String(input.amountUsd));
  if (input.amountConverted != null) form.append('amountConverted', String(input.amountConverted));
  if (input.convertedCurrency) form.append('convertedCurrency', input.convertedCurrency);
  if (input.exchangeRateSnapshot != null) {
    form.append('exchangeRateSnapshot', String(input.exchangeRateSnapshot));
  }
  form.append('receipt', input.receipt);
  const response = await httpRequest<{ paymentRequest: import('@/lib/api/contracts/payments').PaymentRequest }>(
    '/api/memberships/payment-requests',
    { method: 'POST', body: form },
  );
  return response.paymentRequest;
}

export async function getMyPaymentRequests(): Promise<import('@/lib/api/contracts/payments').PaymentRequest[]> {
  const response = await httpRequest<{ paymentRequests: import('@/lib/api/contracts/payments').PaymentRequest[] }>(
    '/api/memberships/payment-requests/mine',
  );
  return response.paymentRequests;
}

export async function listPaymentRequests(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await httpRequest<{ paymentRequests: import('@/lib/api/contracts/payments').PaymentRequest[] }>(
    `/api/memberships/payment-requests${qs}`,
  );
  return response.paymentRequests;
}

export async function approvePaymentRequest(id: string) {
  const response = await httpRequest<{ paymentRequest: import('@/lib/api/contracts/payments').PaymentRequest }>(
    `/api/memberships/payment-requests/${encodeURIComponent(id)}/approve`,
    { method: 'POST' },
  );
  return response.paymentRequest;
}

export async function rejectPaymentRequest(id: string, reason?: string) {
  const response = await httpRequest<{ paymentRequest: import('@/lib/api/contracts/payments').PaymentRequest }>(
    `/api/memberships/payment-requests/${encodeURIComponent(id)}/reject`,
    { method: 'POST', body: { reason } },
  );
  return response.paymentRequest;
}

export async function listExchangeRates(active?: boolean): Promise<import('@/lib/api/contracts/exchange-rates').ExchangeRate[]> {
  const qs = active == null ? '' : `?active=${active ? 'true' : 'false'}`;
  const response = await httpRequest<{ exchangeRates: import('@/lib/api/contracts/exchange-rates').ExchangeRate[] }>(
    `/api/exchange-rates/${qs}`,
  );
  return response.exchangeRates;
}

export async function listPublicExchangeRates(): Promise<import('@/lib/api/contracts/exchange-rates').ExchangeRate[]> {
  const response = await httpRequest<{ exchangeRates: import('@/lib/api/contracts/exchange-rates').ExchangeRate[] }>(
    '/api/exchange-rates/public',
    { auth: false },
  );
  return response.exchangeRates;
}

export async function createExchangeRate(
  data: Omit<import('@/lib/api/contracts/exchange-rates').ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const response = await httpRequest<{ exchangeRate: import('@/lib/api/contracts/exchange-rates').ExchangeRate }>(
    '/api/exchange-rates/',
    { method: 'POST', body: data },
  );
  return response.exchangeRate;
}

export async function updateExchangeRate(
  id: string,
  data: Partial<Omit<import('@/lib/api/contracts/exchange-rates').ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const response = await httpRequest<{ exchangeRate: import('@/lib/api/contracts/exchange-rates').ExchangeRate }>(
    `/api/exchange-rates/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
  );
  return response.exchangeRate;
}

export async function deleteExchangeRate(id: string): Promise<void> {
  await httpRequest(`/api/exchange-rates/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function listRoutines(trainerId?: string): Promise<Routine[]> {
  const params = new URLSearchParams();
  if (trainerId) {
    params.set('trainerId', trainerId);
  }
  const qs = params.toString();
  const response = await httpRequest<{ routines: ApiRoutinePayload[] }>(
    qs ? `/api/routines/?${qs}` : '/api/routines/',
  );
  return response.routines.map(mapApiRoutine);
}

export async function listAssignments(
  trainerId?: string,
  options?: { activeOnly?: boolean },
): Promise<RoutineAssignment[]> {
  const activeOnly = options?.activeOnly ?? true;
  const params = new URLSearchParams();
  if (trainerId) {
    params.set('trainerId', trainerId);
  }
  params.set('activeOnly', String(activeOnly));
  const response = await httpRequest<{ assignments: ApiAssignmentPayload[] }>(
    `/api/routines/assignments?${params.toString()}`,
  );
  return response.assignments.map(mapApiAssignment);
}

export async function assignRoutine(
  athleteId: string,
  routineId: string,
  trainerId: string,
): Promise<RoutineAssignment> {
  const response = await httpRequest<{ assignment: ApiAssignmentPayload }>(
    '/api/routines/assignments',
    {
      method: 'POST',
      body: { athleteId, routineId, trainerId },
    },
  );
  return mapApiAssignment(response.assignment);
}

export async function unassignRoutine(assignmentId: string): Promise<void> {
  await httpRequest(`/api/routines/assignments/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
  });
}

export async function getTrainerAthletes(trainerId: string): Promise<Athlete[]> {
  const response = await httpRequest<{ athletes: ApiAthletePayload[] }>(
    `/api/users/trainer-athletes?trainerId=${encodeURIComponent(trainerId)}`,
  );
  return response.athletes.map(mapApiAthlete);
}

export async function getAdminOverview(): Promise<AdminOverviewPayload> {
  return httpRequest<AdminOverviewPayload>('/api/admin/overview');
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetricsResponse> {
  return httpRequest<AdminDashboardMetricsResponse>('/api/admin/dashboard/metrics');
}

export async function listAdminAthletes(): Promise<Athlete[]> {
  const response = await httpRequest<{ athletes: ApiAthletePayload[] }>('/api/admin/athletes');
  return response.athletes.map(mapApiAthlete);
}

export async function listAdminTrainers(): Promise<Trainer[]> {
  const response = await httpRequest<{ trainers: ApiTrainerPayload[] }>(
    '/api/admin/trainers?includeInactive=true',
  );
  return response.trainers.map(mapApiTrainer);
}

export async function createAdminTrainer(payload: {
  email: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}): Promise<Trainer> {
  const response = await httpRequest<{ trainer: ApiTrainerPayload }>('/api/admin/trainers', {
    method: 'POST',
    body: payload,
  });
  return mapApiTrainer(response.trainer);
}

export async function deactivateAdminTrainer(
  trainerId: string,
  athleteActions: Array<{
    athleteId: string;
    action: 'reassign' | 'unassign';
    newTrainerId?: string;
  }>,
): Promise<void> {
  await httpRequest(`/api/admin/trainers/${encodeURIComponent(trainerId)}`, {
    method: 'DELETE',
    body: {
      athleteActions: athleteActions.map((a) => ({
        athleteId: Number(a.athleteId),
        action: a.action,
        ...(a.newTrainerId ? { newTrainerId: Number(a.newTrainerId) } : {}),
      })),
    },
  });
}

export async function resendTrainerInvite(trainerId: string): Promise<void> {
  await httpRequest(`/api/admin/trainers/${encodeURIComponent(trainerId)}/resend-invite`, {
    method: 'POST',
  });
}

export async function reactivateAdminTrainer(trainerId: string): Promise<void> {
  await updateAdminTrainer(trainerId, { isActive: true });
}

export async function updateAdminTrainer(
  trainerId: string,
  patch: { isActive?: boolean; maxAthletes?: number },
): Promise<void> {
  await httpRequest(`/api/admin/trainers/${encodeURIComponent(trainerId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function assignUserMembership(userId: string, planId: string): Promise<void> {
  await httpRequest(`/api/memberships/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: { planId: Number(planId) },
  });
}

export async function getAthleteById(athleteId: string): Promise<Athlete | null> {
  try {
    const response = await httpRequest<{ athlete: ApiAthletePayload }>(
      `/api/users/athletes/${encodeURIComponent(athleteId)}`,
    );
    return mapApiAthlete(response.athlete);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getTrainerById(trainerId: string): Promise<Trainer | null> {
  const response = await httpRequest<{ trainer: ApiTrainerPayload }>(
    `/api/users/trainers/${encodeURIComponent(trainerId)}`,
  );
  return mapApiTrainer(response.trainer);
}

export async function updateAthlete(
  athleteId: string,
  patch: Partial<Athlete>,
): Promise<Athlete | null> {
  try {
    const response = await httpRequest<{ athlete: ApiAthletePayload }>(
      `/api/users/athletes/${encodeURIComponent(athleteId)}`,
      {
        method: 'PATCH',
        body: patch,
      },
    );
    return mapApiAthlete(response.athlete);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function assignTrainerToAthlete(
  athleteId: string,
  trainerId: string | null,
): Promise<void> {
  await httpRequest(`/api/users/athletes/${encodeURIComponent(athleteId)}/trainer`, {
    method: 'PUT',
    body: { trainerId },
  });
}

export async function unassignTrainerFromAthlete(athleteId: string): Promise<void> {
  await assignTrainerToAthlete(athleteId, null);
}

export async function createRoutine(
  routine: Omit<Routine, 'id' | 'createdDate'>,
  trainerId?: string,
): Promise<Routine> {
  const response = await httpRequest<{ routine: ApiRoutinePayload }>('/api/routines/', {
    method: 'POST',
    body: {
      ...routine,
      ...(trainerId ? { trainerId } : {}),
    },
  });
  return mapApiRoutine(response.routine);
}

export async function deleteRoutine(routineId: string): Promise<void> {
  await httpRequest(`/api/routines/${encodeURIComponent(routineId)}`, {
    method: 'DELETE',
  });
}

export async function updateRoutine(
  routineId: string,
  patch: Partial<Routine>,
): Promise<void> {
  await httpRequest(`/api/routines/${encodeURIComponent(routineId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function updateTrainerProfile(
  trainerId: string,
  patch: { specialization?: string; bio?: string },
): Promise<void> {
  await httpRequest(`/api/users/trainers/${encodeURIComponent(trainerId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function getBodyProfile(): Promise<BodyProfile> {
  const response = await httpRequest<BodyProfileResponse>('/api/users/me/body-profile');
  return response.bodyProfile ?? {};
}

export async function getAthleteBodyProfile(athleteId: string): Promise<BodyProfile> {
  const response = await httpRequest<BodyProfileResponse>(
    `/api/users/athletes/${encodeURIComponent(athleteId)}/body-profile`,
  );
  return response.bodyProfile ?? {};
}

export async function updateBodyProfile(patch: BodyProfile): Promise<BodyProfile> {
  const response = await httpRequest<BodyProfileResponse>('/api/users/me/body-profile', {
    method: 'PATCH',
    body: patch,
  });
  return response.bodyProfile ?? {};
}

export function getStateSnapshot(): never {
  throw new Error('getStateSnapshot no está disponible con DATA_SOURCE=api.');
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  const response = await httpRequest<{ plans: ApiMembershipPlanPayload[] }>(
    '/api/memberships/plans',
  );
  return response.plans.map(mapApiMembershipPlan);
}

export async function listPublicMembershipPlans(): Promise<MembershipPlan[]> {
  const response = await httpRequest<{ plans: ApiMembershipPlanPayload[] }>(
    '/api/memberships/plans/public',
    { auth: false },
  );
  return response.plans.map(mapApiMembershipPlan);
}

export async function createMembershipPlan(
  plan: Omit<MembershipPlan, 'id' | 'createdAt'>,
): Promise<MembershipPlan> {
  const response = await httpRequest<{ plan: ApiMembershipPlanPayload }>(
    '/api/memberships/plans',
    {
      method: 'POST',
      body: plan,
    },
  );
  return mapApiMembershipPlan(response.plan);
}

export async function deleteMembershipPlan(id: string): Promise<void> {
  await httpRequest(`/api/memberships/plans/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function updateMembershipPlan(
  id: string,
  updates: Partial<Omit<MembershipPlan, 'id' | 'createdAt'>>,
): Promise<MembershipPlan | null> {
  try {
    const response = await httpRequest<{ plan: ApiMembershipPlanPayload }>(
      `/api/memberships/plans/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: updates,
      },
    );
    return mapApiMembershipPlan(response.plan);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function publishMealPlan(
  plan: AssignedNutritionPlan,
): Promise<AssignedNutritionPlan> {
  const response = await httpRequest<{ plan: ApiNutritionPlanPayload }>(
    '/api/nutrition/plan',
    {
      method: 'PUT',
      body: plan,
    },
  );
  const published = mapApiNutritionPlan(response.plan);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fittrack-nutrition-published', { detail: { athleteId: plan.athleteId } }),
    );
  }
  return published;
}

export async function getCoachNutritionDraft(athleteId: string): Promise<CoachNutritionDraft> {
  const response = await httpRequest<{ draft: CoachNutritionDraft }>(
    `/api/nutrition/coach-draft?athleteId=${encodeURIComponent(athleteId)}`,
  );
  return {
    ...response.draft,
    activityLevel: normalizeActivityLevel(response.draft.activityLevel),
  };
}

export async function saveCoachNutritionDraft(
  athleteId: string,
  draft: CoachNutritionDraft,
): Promise<CoachNutritionDraft> {
  const response = await httpRequest<{ draft: CoachNutritionDraft }>(
    '/api/nutrition/coach-draft',
    {
      method: 'PUT',
      body: { athleteId, draft },
    },
  );
  return response.draft;
}

export type ExercisesPagination = {
  page: number;
  perPage: number;
  total: number;
  pages: number;
};

export type ExercisesListResult = {
  exercises: Exercise[];
  pagination: ExercisesPagination;
};

export type ExerciseSource = 'all' | 'catalog' | 'custom';
export type ExerciseCustomScope = 'mine' | 'platform' | 'all';

export async function listExercisesPaginated(opts?: {
  muscle?: string;
  page?: number;
  perPage?: number;
  customOnly?: boolean;
  source?: ExerciseSource;
  customScope?: ExerciseCustomScope;
  q?: string;
}): Promise<ExercisesListResult> {
  const params = new URLSearchParams();
  if (opts?.muscle) params.set('muscle', opts.muscle);
  if (opts?.customOnly) params.set('custom_only', 'true');
  if (opts?.source) params.set('source', opts.source);
  if (opts?.customScope) params.set('custom_scope', opts.customScope);
  if (opts?.q) params.set('q', opts.q);
  params.set('page', String(opts?.page ?? 1));
  params.set('per_page', String(opts?.perPage ?? 20));
  const response = await httpRequest<{
    exercises: ApiExercisePayload[];
    pagination: { page: number; per_page: number; total: number; pages: number };
  }>(`/api/exercises/cached?${params.toString()}`);
  return {
    exercises: response.exercises.map(mapApiExercise),
    pagination: {
      page: response.pagination.page,
      perPage: response.pagination.per_page,
      total: response.pagination.total,
      pages: response.pagination.pages,
    },
  };
}

export async function listExercises(opts?: {
  muscle?: string;
  page?: number;
  perPage?: number;
  customOnly?: boolean;
  source?: ExerciseSource;
  q?: string;
}): Promise<Exercise[]> {
  const result = await listExercisesPaginated(opts);
  return result.exercises;
}

export async function listExercisesByMuscle(muscle: string, limit = 50): Promise<Exercise[]> {
  const response = await httpRequest<{ exercises: ApiExercisePayload[] }>(
    `/api/exercises/by-muscle/${encodeURIComponent(muscle)}?limit=${limit}`,
    { auth: false },
  );
  return response.exercises.map(mapApiExercise);
}

export async function syncExerciseCatalog(): Promise<{
  syncedMuscles: number;
  totalCached: number;
  added: number;
}> {
  const response = await httpRequest<{
    synced_muscles: number;
    total_cached: number;
    added: number;
  }>('/api/exercises/sync-catalog', { method: 'POST' });
  return {
    syncedMuscles: response.synced_muscles,
    totalCached: response.total_cached,
    added: response.added,
  };
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const response = await httpRequest<{ exercises: ApiExercisePayload[] }>(
    `/api/exercises/search?q=${encodeURIComponent(query)}&limit=50`,
  );
  return response.exercises.map(mapApiExercise);
}

export async function getExerciseById(exerciseId: string): Promise<Exercise | null> {
  try {
    const response = await httpRequest<{ exercise: ApiExercisePayload }>(
      `/api/exercises/${encodeURIComponent(exerciseId)}`,
      { auth: false },
    );
    return mapApiExercise(response.exercise);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createExercise(payload: CreateExercisePayload): Promise<Exercise> {
  const response = await httpRequest<{ exercise: ApiExercisePayload }>('/api/exercises', {
    method: 'POST',
    body: {
      name: payload.name,
      target_muscle: payload.targetMuscle,
      equipment: payload.equipment,
      difficulty: payload.difficulty,
      description: payload.description,
    },
  });
  return mapApiExercise(response.exercise);
}

export async function updateExercise(
  exerciseId: string,
  payload: UpdateExercisePayload,
): Promise<Exercise> {
  const response = await httpRequest<{ exercise: ApiExercisePayload }>(
    `/api/exercises/${encodeURIComponent(exerciseId)}`,
    {
      method: 'PATCH',
      body: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.targetMuscle !== undefined ? { target_muscle: payload.targetMuscle } : {}),
        ...(payload.equipment !== undefined ? { equipment: payload.equipment } : {}),
        ...(payload.difficulty !== undefined ? { difficulty: payload.difficulty } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
      },
    },
  );
  return mapApiExercise(response.exercise);
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  await httpRequest(`/api/exercises/${encodeURIComponent(exerciseId)}`, {
    method: 'DELETE',
  });
}

export async function matchExerciseAnimation(exerciseId: string): Promise<Exercise> {
  const response = await httpRequest<{ exercise: ApiExercisePayload }>(
    `/api/exercises/${encodeURIComponent(exerciseId)}/match-animation`,
    { method: 'POST' },
  );
  return mapApiExercise(response.exercise);
}

export async function uploadExerciseMedia(exerciseId: string, file: File): Promise<Exercise> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpRequest<{ exercise: ApiExercisePayload }>(
    `/api/exercises/${encodeURIComponent(exerciseId)}/media`,
    {
      method: 'POST',
      body: formData,
    },
  );
  return mapApiExercise(response.exercise);
}

export async function uploadSessionExecutionVideo(
  athleteId: string,
  file: File,
): Promise<{ url: string; uploadedAt: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('athleteId', athleteId);
  const response = await httpRequest<{ url: string; uploadedAt: string | null }>(
    '/api/sessions/execution-media',
    {
      method: 'POST',
      body: formData,
    },
  );
  return {
    ...response,
    url: resolveApiUrl(response.url) ?? response.url,
  };
}

export type ExerciseMusclesSource = 'api' | 'catalog';

export async function listExerciseMuscles(
  options?: { source?: ExerciseMusclesSource },
): Promise<string[]> {
  const params = new URLSearchParams();
  if (options?.source) {
    params.set('source', options.source);
  }
  const query = params.toString();
  const response = await httpRequest<{ muscles: string[] }>(
    `/api/exercises/muscles${query ? `?${query}` : ''}`,
    {
      auth: false,
    },
  );
  return response.muscles;
}

export async function getDiary(athleteId: string, date?: string): Promise<AthleteDiaryState> {
  const params = new URLSearchParams({ athleteId });
  if (date) params.set('date', date);
  const response = await httpRequest<DiaryResponse>(`/api/nutrition/diary?${params.toString()}`);
  return response.diary;
}

export async function putDiary(
  athleteId: string,
  state: AthleteDiaryState,
): Promise<AthleteDiaryState> {
  const body: DiaryPutRequest = {
    athleteId,
    foodLog: state.foodLog,
    waterByDate: state.waterByDate,
    waterGoalMl: state.waterGoalMl,
  };
  const response = await httpRequest<DiaryResponse>('/api/nutrition/diary', {
    method: 'PUT',
    body: { ...body, athleteId: Number(athleteId) },
  });
  return response.diary;
}

export async function addDiaryEntry(
  athleteId: string,
  date: string,
  item: DiaryEntryPostRequest['item'],
): Promise<AthleteDiaryState> {
  const response = await httpRequest<DiaryResponse>('/api/nutrition/diary/entries', {
    method: 'POST',
    body: {
      athleteId: Number(athleteId),
      date,
      item,
    },
  });
  return response.diary;
}

export async function deleteDiaryEntry(
  athleteId: string,
  entryId: string,
  date?: string,
): Promise<AthleteDiaryState> {
  const params = new URLSearchParams({ athleteId });
  if (date) params.set('date', date);
  const response = await httpRequest<DiaryResponse>(
    `/api/nutrition/diary/entries/${encodeURIComponent(entryId)}?${params.toString()}`,
    { method: 'DELETE' },
  );
  return response.diary;
}

export async function patchDiaryWater(
  athleteId: string,
  payload: Omit<DiaryWaterPatchRequest, 'athleteId'>,
): Promise<AthleteDiaryState> {
  const response = await httpRequest<DiaryResponse>('/api/nutrition/diary/water', {
    method: 'PATCH',
    body: {
      athleteId: Number(athleteId),
      ...payload,
    },
  });
  return response.diary;
}

export async function listNotifications() {
  const response = await httpRequest<import('@/lib/api/contracts/notifications').NotificationsListResponse>(
    '/api/notifications/',
  );
  return response.notifications;
}

export async function getUnreadNotificationCount() {
  const response = await httpRequest<import('@/lib/api/contracts/notifications').UnreadCountResponse>(
    '/api/notifications/unread-count',
  );
  return response.count;
}

export async function markNotificationRead(id: string) {
  const response = await httpRequest<{ notification: import('@/lib/api/contracts/notifications').NotificationRecord }>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    { method: 'POST' },
  );
  return response.notification;
}

export async function markAllNotificationsRead() {
  await httpRequest('/api/notifications/read-all', { method: 'POST' });
}

export async function getMySupportThread() {
  return httpRequest<import('@/lib/api/contracts/support').SupportThreadResponse>('/api/support/thread');
}

export async function sendAthleteSupportMessage(body: string) {
  const response = await httpRequest<import('@/lib/api/contracts/support').SupportMessageResponse>(
    '/api/support/messages',
    { method: 'POST', body: { body } },
  );
  return response.message;
}

export async function markMySupportThreadRead() {
  await httpRequest('/api/support/thread/read', { method: 'POST' });
}

export async function listSupportThreads() {
  const response = await httpRequest<import('@/lib/api/contracts/support').SupportThreadsResponse>(
    '/api/support/threads',
  );
  return response.threads;
}

export async function getSupportThread(athleteId: string) {
  return httpRequest<import('@/lib/api/contracts/support').SupportThreadResponse>(
    `/api/support/threads/${encodeURIComponent(athleteId)}`,
  );
}

export async function sendAdminSupportMessage(athleteId: string, body: string) {
  const response = await httpRequest<import('@/lib/api/contracts/support').SupportMessageResponse>(
    `/api/support/threads/${encodeURIComponent(athleteId)}/messages`,
    { method: 'POST', body: { body } },
  );
  return response.message;
}

export async function markSupportThreadRead(athleteId: string) {
  await httpRequest(`/api/support/threads/${encodeURIComponent(athleteId)}/read`, {
    method: 'POST',
  });
}
