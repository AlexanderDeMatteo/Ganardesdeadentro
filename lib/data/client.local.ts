import type { Membership } from '@/app/context/auth-context';
import { isDevDataSnapshotEnabled } from '@/lib/api/config';
import { getDataState, setDataState } from '@/lib/data/store';
import { SEED_EXERCISES } from '@/lib/data/seeds';
import type {
  Athlete,
  Exercise,
  Metric,
  Routine,
  RoutineAssignment,
  SessionLog,
  Trainer,
  WeeklyPlan,
  WeeklyPlanDay,
} from '@/lib/data/types';
import type { MembershipPlan } from '@/hooks/use-memberships';
import {
  loadAssignedPlan,
  loadCoachDraft,
  saveAssignedPlan,
  saveCoachDraft,
} from '@/lib/nutrition/assigned-storage';
import {
  loadDiaryState,
  migrateLegacyDiaryIfNeeded,
  saveDiaryState,
} from '@/lib/nutrition/diary-storage';
import type { AssignedNutritionPlan, AthleteDiaryState, CoachNutritionDraft, MealItem } from '@/lib/nutrition/types';
import { getMondayOfWeek } from '@/lib/workout/session-utils';

const delay = () => new Promise<void>((r) => setTimeout(r, 0));

function withLatestMetric(athlete: Athlete): Athlete {
  if (!athlete.metrics) return athlete;
  return {
    ...athlete,
    latestMetric: {
      weight: athlete.metrics.weight,
      bodyFat: athlete.metrics.bodyFat,
      muscleMass: athlete.metrics.muscleMass,
      date: athlete.joinDate,
    },
  };
}

function findAthlete(athleteId: string): Athlete | undefined {
  return getDataState().athletes.find((a) => a.id === athleteId);
}

function findRoutine(routineId: string): Routine | undefined {
  return getDataState().routines.find((r) => r.id === routineId);
}

function getActiveAssignment(athleteId: string): RoutineAssignment | undefined {
  return getDataState().assignments.find((a) => a.athleteId === athleteId && a.isActive);
}

/** Map membership level to catalog plan id */
export function membershipLevelToPlanId(level: Athlete['membershipLevel']): string {
  switch (level) {
    case 'premium':
      return '2';
    case 'pro':
      return '3';
    default:
      return '1';
  }
}

/** Map auth membership name to catalog plan id */
export function membershipNameToPlanId(name: Membership['name']): string {
  switch (name) {
    case 'Premium':
      return '2';
    case 'Pro':
      return '3';
    default:
      return '1';
  }
}

// ---------------------------------------------------------------------------
// Athlete endpoints
// ---------------------------------------------------------------------------

/**
 * @endpoint GET /api/routines/my?athleteId=
 * @auth Bearer (owner | assigned trainer | admin)
 * @see docs/API_CONTRACTS.md#routines-my
 */
export async function getMyRoutine(athleteId: string): Promise<{
  assignment: RoutineAssignment | null;
  routine: Routine | null;
}> {
  await delay();
  const assignment = getActiveAssignment(athleteId) ?? null;
  if (!assignment) return { assignment: null, routine: null };
  const routine = findRoutine(assignment.routineId) ?? null;
  return { assignment, routine };
}

/**
 * @endpoint GET /api/metrics?athleteId=
 * @auth Bearer (owner | assigned trainer | admin)
 * @see docs/API_CONTRACTS.md#metrics-list
 */
export async function getAthleteMetrics(athleteId: string): Promise<Metric[]> {
  await delay();
  return getDataState()
    .metrics.filter((m) => m.athleteId === athleteId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * POST /api/metrics
 * Body: { athleteId, ...metricFields }
 */
export async function addMetric(
  athleteId: string,
  entry: Omit<Metric, 'id' | 'athleteId'>,
): Promise<Metric> {
  await delay();
  const newEntry: Metric = {
    ...entry,
    id: Date.now().toString(),
    athleteId,
  };
  setDataState((prev) => ({
    ...prev,
    metrics: [...prev.metrics, newEntry],
  }));
  return newEntry;
}

/**
 * PATCH /api/metrics/:id
 */
export async function updateMetric(
  id: string,
  patch: Partial<Omit<Metric, 'id' | 'athleteId'>>,
): Promise<Metric | null> {
  await delay();
  let updated: Metric | null = null;
  setDataState((prev) => ({
    ...prev,
    metrics: prev.metrics.map((m) => {
      if (m.id !== id) return m;
      updated = { ...m, ...patch };
      return updated;
    }),
  }));
  return updated;
}

/**
 * DELETE /api/metrics/:id
 */
export async function removeMetric(id: string): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    metrics: prev.metrics.filter((m) => m.id !== id),
  }));
}

/**
 * @endpoint GET /api/nutrition/plan?athleteId=
 * @auth Bearer (owner | assigned trainer | admin)
 * @see docs/API_CONTRACTS.md#nutrition-plan-get
 */
export async function getMealPlan(athleteId: string): Promise<AssignedNutritionPlan | null> {
  await delay();
  if (typeof window === 'undefined') return null;
  return loadAssignedPlan(athleteId);
}

/**
 * POST /api/sessions/complete
 * Body: full SessionLog payload with setLogs detail
 */
export async function markSessionComplete(
  athleteId: string,
  payload: Omit<SessionLog, 'id' | 'athleteId' | 'date'> & { date?: string },
): Promise<SessionLog> {
  await delay();
  const date = payload.date ?? new Date().toISOString();
  const log: SessionLog = {
    id: Date.now().toString(),
    athleteId,
    routineId: payload.routineId,
    assignmentId: payload.assignmentId,
    weekPlanId: payload.weekPlanId,
    scheduledDate: payload.scheduledDate ?? date.split('T')[0],
    date,
    setLogs: payload.setLogs ?? [],
    completed: payload.completed,
    completedSets: payload.completedSets,
    failedSets: payload.failedSets,
    totalSets: payload.totalSets,
    sessionOutcome: payload.sessionOutcome,
  };
  setDataState((prev) => ({
    ...prev,
    sessionLogs: [...prev.sessionLogs, log],
  }));
  return log;
}

/**
 * GET /api/sessions?athleteId=
 */
export async function getAthleteSessionLogs(athleteId: string): Promise<SessionLog[]> {
  await delay();
  return getDataState()
    .sessionLogs.filter((s) => s.athleteId === athleteId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * GET /api/sessions/week?athleteId=&weekStartDate=
 */
export async function getSessionLogsForWeek(
  athleteId: string,
  weekStartDate?: string,
): Promise<SessionLog[]> {
  await delay();
  const start = weekStartDate ?? getMondayOfWeek();
  const endDate = new Date(start + 'T12:00:00');
  endDate.setDate(endDate.getDate() + 6);
  const end = endDate.toISOString().split('T')[0];
  return getDataState()
    .sessionLogs.filter(
      (s) =>
        s.athleteId === athleteId &&
        s.scheduledDate >= start &&
        s.scheduledDate <= end,
    )
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

/**
 * GET /api/exercise-progress?athleteId=&exerciseId=
 */
export async function getExerciseProgress(
  athleteId: string,
  exerciseId: string,
): Promise<Array<{ date: string; maxWeightKg: number; sessionId: string }>> {
  await delay();
  const points: Array<{ date: string; maxWeightKg: number; sessionId: string }> = [];
  for (const session of getDataState().sessionLogs) {
    if (session.athleteId !== athleteId) continue;
    const weights = (session.setLogs ?? [])
      .filter((l) => l.exerciseId === exerciseId && l.weightKg != null && l.weightKg > 0)
      .map((l) => l.weightKg as number);
    if (weights.length === 0) continue;
    points.push({
      date: session.scheduledDate,
      maxWeightKg: Math.max(...weights),
      sessionId: session.id,
    });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  await delay();
  return findRoutine(routineId) ?? null;
}

/**
 * GET /api/weekly-plan?athleteId=
 */
export async function getWeeklyPlan(athleteId: string): Promise<WeeklyPlan | null> {
  await delay();
  const weekStart = getMondayOfWeek();
  const active = getDataState().weeklyPlans.find(
    (p) => p.athleteId === athleteId && p.isActive && p.weekStartDate === weekStart,
  );
  if (active) return active;
  return (
    getDataState().weeklyPlans.find((p) => p.athleteId === athleteId && p.isActive) ?? null
  );
}

/**
 * POST /api/weekly-plan
 * Body: { athleteId, trainerId, weekStartDate?, days }
 */
export async function assignWeeklyPlan(
  athleteId: string,
  trainerId: string,
  days: WeeklyPlanDay[],
  weekStartDate?: string,
): Promise<WeeklyPlan> {
  await delay();
  const start = weekStartDate ?? getMondayOfWeek();
  const plan: WeeklyPlan = {
    id: Date.now().toString(),
    athleteId,
    trainerId,
    weekStartDate: start,
    days,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  setDataState((prev) => ({
    ...prev,
    weeklyPlans: [
      ...prev.weeklyPlans.map((p) =>
        p.athleteId === athleteId && p.weekStartDate === start
          ? { ...p, isActive: false }
          : p,
      ),
      plan,
    ],
  }));
  return plan;
}

/**
 * GET /api/trainers/my?athleteId=
 */
export async function getMyTrainer(athleteId: string): Promise<Trainer | null> {
  await delay();
  const athlete = findAthlete(athleteId);
  if (!athlete?.trainerId) return null;
  return getDataState().trainers.find((t) => t.id === athlete.trainerId) ?? null;
}

/**
 * GET /api/memberships/current?athleteId=
 */
export async function getMembership(athleteId: string): Promise<{
  level: Athlete['membershipLevel'];
  planId: string;
} | null> {
  await delay();
  const athlete = findAthlete(athleteId);
  if (!athlete) return null;
  return {
    level: athlete.membershipLevel,
    planId: athlete.membershipId ?? membershipLevelToPlanId(athlete.membershipLevel),
  };
}

export async function subscribeMembership(_planId: string): Promise<void> {
  await delay();
  // En modo local la suscripción se gestiona en memberships/page-client.tsx vía localStorage.
}

// ---------------------------------------------------------------------------
// Trainer endpoints (Fase 2)
// ---------------------------------------------------------------------------

/**
 * POST /api/assignments
 * Body: { athleteId, routineId, trainerId }
 */
export async function assignRoutine(
  athleteId: string,
  routineId: string,
  trainerId: string,
): Promise<RoutineAssignment> {
  await delay();
  const assignment: RoutineAssignment = {
    id: Date.now().toString(),
    athleteId,
    routineId,
    trainerId,
    assignedDate: new Date().toISOString().split('T')[0],
    isActive: true,
  };
  setDataState((prev) => ({
    ...prev,
    assignments: [
      ...prev.assignments.filter((a) => !(a.athleteId === athleteId && a.isActive)),
      assignment,
    ],
  }));
  return assignment;
}

/**
 * DELETE /api/assignments/:id
 */
export async function unassignRoutine(assignmentId: string): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    assignments: prev.assignments.map((a) =>
      a.id === assignmentId ? { ...a, isActive: false } : a,
    ),
  }));
}

/**
 * GET /api/trainers/:trainerId/athletes
 */
export async function getTrainerAthletes(trainerId: string): Promise<Athlete[]> {
  await delay();
  return getDataState().athletes.filter((a) => a.trainerId === trainerId).map(withLatestMetric);
}

export async function listRoutines(trainerId?: string): Promise<Routine[]> {
  await delay();
  if (!trainerId) {
    return getDataState().routines;
  }
  return getDataState().routines.filter((r) => !r.trainerId || r.trainerId === trainerId);
}

export async function listAssignments(
  trainerId?: string,
  options?: { activeOnly?: boolean },
): Promise<RoutineAssignment[]> {
  await delay();
  const activeOnly = options?.activeOnly ?? true;
  return getDataState().assignments.filter(
    (a) => (!trainerId || a.trainerId === trainerId) && (!activeOnly || a.isActive),
  );
}

// ---------------------------------------------------------------------------
// Admin endpoints (Fase 3)
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/overview
 */
export async function getAdminOverview(): Promise<{
  trainerCount: number;
  athleteCount: number;
  assignmentCount: number;
  athletesWithoutTrainer: number;
  trainersWithoutAthletes: number;
}> {
  await delay();
  const state = getDataState();
  const activeAssignments = state.assignments.filter((a) => a.isActive);
  const athletesWithoutTrainer = state.athletes.filter((a) => !a.trainerId).length;
  const trainersWithAthletes = new Set(state.athletes.map((a) => a.trainerId).filter(Boolean));
  const trainersWithoutAthletes = state.trainers.filter((t) => !trainersWithAthletes.has(t.id)).length;

  return {
    trainerCount: state.trainers.length,
    athleteCount: state.athletes.length,
    assignmentCount: activeAssignments.length,
    athletesWithoutTrainer,
    trainersWithoutAthletes,
  };
}

export async function listAdminAthletes(): Promise<Athlete[]> {
  await delay();
  return getDataState().athletes.map(withLatestMetric);
}

export async function listAdminTrainers(): Promise<Trainer[]> {
  await delay();
  return [...getDataState().trainers];
}

export async function createAdminTrainer(payload: {
  email: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}): Promise<Trainer> {
  await delay();
  const id = `trainer-${Date.now()}`;
  const trainer: Trainer = {
    id,
    name: `${payload.firstName} ${payload.lastName}`.trim(),
    email: payload.email,
    specialization: payload.specialization ?? 'General',
    athletes: 0,
    rating: 0,
    joinDate: new Date().toISOString(),
    isActive: false,
    invitePending: true,
    maxAthletes: 10,
  };
  setDataState((prev) => ({ ...prev, trainers: [...prev.trainers, trainer] }));
  return trainer;
}

export async function deactivateAdminTrainer(
  trainerId: string,
  athleteActions: Array<{
    athleteId: string;
    action: 'reassign' | 'unassign';
    newTrainerId?: string;
  }>,
): Promise<void> {
  await delay();
  setDataState((prev) => {
    let athletes = [...prev.athletes];
    for (const action of athleteActions) {
      athletes = athletes.map((a) => {
        if (a.id !== action.athleteId) return a;
        if (action.action === 'unassign') return { ...a, trainerId: undefined };
        return { ...a, trainerId: action.newTrainerId };
      });
    }
    const trainers = prev.trainers.map((t) =>
      t.id === trainerId ? { ...t, isActive: false, invitePending: false } : t,
    );
    return { ...prev, athletes, trainers };
  });
}

export async function reactivateAdminTrainer(trainerId: string): Promise<void> {
  await updateAdminTrainer(trainerId, { isActive: true });
}

export async function updateAdminTrainer(
  trainerId: string,
  patch: { isActive?: boolean; maxAthletes?: number },
): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    trainers: prev.trainers.map((t) => {
      if (t.id !== trainerId) return t;
      return {
        ...t,
        ...(patch.isActive === true ? { isActive: true, invitePending: false } : {}),
        ...(patch.maxAthletes != null ? { maxAthletes: patch.maxAthletes } : {}),
      };
    }),
  }));
}

export async function resendTrainerInvite(_trainerId: string): Promise<void> {
  await delay();
}

export async function unassignTrainerFromAthlete(athleteId: string): Promise<void> {
  await assignTrainerToAthlete(athleteId, null);
}

export async function getAthleteById(athleteId: string): Promise<Athlete | null> {
  await delay();
  return findAthlete(athleteId) ?? null;
}

export async function getTrainerById(trainerId: string): Promise<Trainer | null> {
  await delay();
  return getDataState().trainers.find((t) => t.id === trainerId) ?? null;
}

export async function updateAthlete(
  athleteId: string,
  patch: Partial<Athlete>,
): Promise<Athlete | null> {
  await delay();
  let updated: Athlete | null = null;
  setDataState((prev) => ({
    ...prev,
    athletes: prev.athletes.map((a) => {
      if (a.id !== athleteId) return a;
      updated = { ...a, ...patch };
      return updated;
    }),
  }));
  return updated;
}

export async function assignTrainerToAthlete(
  athleteId: string,
  trainerId: string | null,
): Promise<void> {
  await delay();
  setDataState((prev) => {
    const oldTrainerId = prev.athletes.find((a) => a.id === athleteId)?.trainerId;
    const athletes = prev.athletes.map((a) =>
      a.id === athleteId ? { ...a, trainerId: trainerId ?? undefined } : a,
    );
    const trainers = prev.trainers.map((t) => {
      if (trainerId && t.id === trainerId) return { ...t, athletes: t.athletes + 1 };
      if (oldTrainerId && t.id === oldTrainerId && t.athletes > 0) {
        return { ...t, athletes: t.athletes - 1 };
      }
      return t;
    });
    return { ...prev, athletes, trainers };
  });
}

export async function createRoutine(
  routine: Omit<Routine, 'id' | 'createdDate'>,
  trainerId?: string,
): Promise<Routine> {
  await delay();
  const newRoutine: Routine = {
    ...routine,
    id: Date.now().toString(),
    createdDate: new Date().toISOString().split('T')[0],
    trainerId: routine.trainerId ?? trainerId,
  };
  setDataState((prev) => ({
    ...prev,
    routines: [...prev.routines, newRoutine],
  }));
  return newRoutine;
}

export async function deleteRoutine(routineId: string): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    routines: prev.routines.filter((r) => r.id !== routineId),
    assignments: prev.assignments.filter((a) => a.routineId !== routineId),
  }));
}

export async function updateRoutine(routineId: string, patch: Partial<Routine>): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    routines: prev.routines.map((r) => (r.id === routineId ? { ...r, ...patch } : r)),
  }));
}

export async function updateTrainerProfile(
  trainerId: string,
  patch: { specialization?: string; bio?: string },
): Promise<void> {
  await delay();
  setDataState((prev) => ({
    ...prev,
    trainers: prev.trainers.map((t) =>
      t.id === trainerId ? { ...t, ...patch } : t,
    ),
  }));
}

export function getStateSnapshot() {
  if (!isDevDataSnapshotEnabled()) {
    throw new Error('getStateSnapshot solo está disponible en DATA_SOURCE=local (desarrollo).');
  }
  return getDataState();
}

const MEMBERSHIP_PLANS_KEY = 'fitness_membership_plans';

const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: '1',
    name: 'Básica',
    price: 9.99,
    description: 'Acceso a rutinas básicas y seguimiento de peso',
    features: ['Rutinas prehechas', 'Seguimiento de peso', 'Comunidad'],
    durationDays: 30,
    color: 'blue',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Premium',
    price: 29.99,
    description: 'Rutinas personalizadas con seguimiento completo de métricas',
    features: [
      'Rutinas personalizadas',
      'Seguimiento completo de métricas',
      'Chat con entrenador',
      'Ajustes de rutina mensuales',
    ],
    durationDays: 30,
    color: 'purple',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pro',
    price: 59.99,
    description: 'Acceso total con sesiones privadas y plan nutricional',
    features: [
      'Todo de Premium',
      'Sesiones privadas semanales',
      'Plan nutricional personalizado',
      'Videoconferencias ilimitadas',
      'Análisis de progreso detallado',
    ],
    durationDays: 30,
    color: 'amber',
    createdAt: new Date().toISOString(),
  },
];

function loadMembershipPlansFromStorage(): MembershipPlan[] {
  if (typeof window === 'undefined') return DEFAULT_MEMBERSHIP_PLANS;
  const stored = localStorage.getItem(MEMBERSHIP_PLANS_KEY);
  if (!stored) {
    localStorage.setItem(MEMBERSHIP_PLANS_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
    return DEFAULT_MEMBERSHIP_PLANS;
  }
  try {
    return JSON.parse(stored) as MembershipPlan[];
  } catch {
    return DEFAULT_MEMBERSHIP_PLANS;
  }
}

function saveMembershipPlansToStorage(plans: MembershipPlan[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEMBERSHIP_PLANS_KEY, JSON.stringify(plans));
}

/**
 * @endpoint GET /api/memberships/plans
 * @auth Bearer (admin)
 * @see docs/API_CONTRACTS.md#memberships-plans-list
 */
export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  await delay();
  return loadMembershipPlansFromStorage();
}

/**
 * @endpoint POST /api/memberships/plans
 * @auth Bearer (admin)
 * @see docs/API_CONTRACTS.md#memberships-plans-create
 */
export async function createMembershipPlan(
  plan: Omit<MembershipPlan, 'id' | 'createdAt'>,
): Promise<MembershipPlan> {
  await delay();
  const plans = loadMembershipPlansFromStorage();
  const newPlan: MembershipPlan = {
    ...plan,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const updated = [...plans, newPlan];
  saveMembershipPlansToStorage(updated);
  return newPlan;
}

/**
 * @endpoint DELETE /api/memberships/plans/:id
 * @auth Bearer (admin)
 * @see docs/API_CONTRACTS.md#memberships-plans-delete
 */
export async function deleteMembershipPlan(id: string): Promise<void> {
  await delay();
  const updated = loadMembershipPlansFromStorage().filter((p) => p.id !== id);
  saveMembershipPlansToStorage(updated);
}

/**
 * @endpoint PATCH /api/memberships/plans/:id
 * @auth Bearer (admin)
 * @see docs/API_CONTRACTS.md#memberships-plans-update
 */
export async function updateMembershipPlan(
  id: string,
  updates: Partial<Omit<MembershipPlan, 'id' | 'createdAt'>>,
): Promise<MembershipPlan | null> {
  await delay();
  const plans = loadMembershipPlansFromStorage();
  const index = plans.findIndex((p) => p.id === id);
  if (index < 0) return null;
  const updated = { ...plans[index], ...updates };
  const next = [...plans];
  next[index] = updated;
  saveMembershipPlansToStorage(next);
  return updated;
}

export async function assignUserMembership(userId: string, planId: string): Promise<void> {
  await delay();
  const plans = loadMembershipPlansFromStorage();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;

  const levelMap: Record<MembershipPlan['name'], Athlete['membershipLevel']> = {
    Básica: 'basic',
    Premium: 'premium',
    Pro: 'pro',
  };

  setDataState((prev) => ({
    ...prev,
    athletes: prev.athletes.map((a) =>
      a.id === userId
        ? {
            ...a,
            membershipId: planId,
            membershipLevel: levelMap[plan.name] ?? a.membershipLevel,
          }
        : a,
    ),
  }));
}

/**
 * @endpoint PUT /api/nutrition/plan
 * @auth Bearer (trainer assigned | admin)
 * @see docs/API_CONTRACTS.md#nutrition-publish
 */
export async function publishMealPlan(plan: AssignedNutritionPlan): Promise<AssignedNutritionPlan> {
  await delay();
  saveAssignedPlan(plan);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fittrack-nutrition-published', { detail: { athleteId: plan.athleteId } }),
    );
  }
  return plan;
}

/**
 * @endpoint GET /api/nutrition/coach-draft?athleteId=
 * @auth Bearer (trainer assigned | admin)
 * @see docs/API_CONTRACTS.md#nutrition-coach-draft
 */
export async function getCoachNutritionDraft(athleteId: string): Promise<CoachNutritionDraft> {
  await delay();
  if (typeof window === 'undefined') {
    const { createDefaultCoachDraft } = await import('@/lib/nutrition/assigned-storage');
    return createDefaultCoachDraft();
  }
  return loadCoachDraft(athleteId);
}

/**
 * @endpoint PUT /api/nutrition/coach-draft
 * @auth Bearer (trainer assigned | admin)
 * @see docs/API_CONTRACTS.md#nutrition-coach-draft-save
 */
export async function saveCoachNutritionDraft(
  athleteId: string,
  draft: CoachNutritionDraft,
): Promise<CoachNutritionDraft> {
  await delay();
  saveCoachDraft(athleteId, draft);
  return draft;
}

export async function listExercises(_opts?: {
  muscle?: string;
  page?: number;
  perPage?: number;
}): Promise<Exercise[]> {
  await delay();
  return [...SEED_EXERCISES];
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  await delay();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEED_EXERCISES.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.targetMuscle.toLowerCase().includes(q),
  );
}

export async function getDiary(athleteId: string, _date?: string): Promise<AthleteDiaryState> {
  await delay();
  return migrateLegacyDiaryIfNeeded(athleteId);
}

export async function putDiary(athleteId: string, state: AthleteDiaryState): Promise<AthleteDiaryState> {
  await delay();
  saveDiaryState(athleteId, state);
  return state;
}

export async function addDiaryEntry(
  athleteId: string,
  date: string,
  item: Omit<MealItem, 'id'> & { id?: string },
): Promise<AthleteDiaryState> {
  await delay();
  const current = loadDiaryState(athleteId);
  const newItem: MealItem = {
    ...item,
    id: item.id ?? `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const idx = current.foodLog.findIndex((e) => e.date === date);
  const foodLog = [...current.foodLog];
  if (idx >= 0) {
    foodLog[idx] = { ...foodLog[idx], items: [...foodLog[idx].items, newItem] };
  } else {
    foodLog.push({ date, items: [newItem] });
  }
  const next = { ...current, foodLog };
  saveDiaryState(athleteId, next);
  return next;
}

export async function deleteDiaryEntry(
  athleteId: string,
  entryId: string,
  date?: string,
): Promise<AthleteDiaryState> {
  await delay();
  const current = loadDiaryState(athleteId);
  const next = {
    ...current,
    foodLog: current.foodLog
      .map((e) =>
        date && e.date !== date
          ? e
          : { ...e, items: e.items.filter((i) => i.id !== entryId) },
      )
      .filter((e) => e.items.length > 0),
  };
  saveDiaryState(athleteId, next);
  return next;
}

export async function patchDiaryWater(
  athleteId: string,
  payload: { date: string; ml?: number; mlDelta?: number; goalMl?: number },
): Promise<AthleteDiaryState> {
  await delay();
  const current = loadDiaryState(athleteId);
  const waterByDate = { ...current.waterByDate };
  if (payload.ml !== undefined) {
    waterByDate[payload.date] = payload.ml;
  } else if (payload.mlDelta !== undefined) {
    waterByDate[payload.date] = Math.max(0, (waterByDate[payload.date] ?? 0) + payload.mlDelta);
  }
  const next = {
    ...current,
    waterByDate,
    waterGoalMl: payload.goalMl ?? current.waterGoalMl,
  };
  saveDiaryState(athleteId, next);
  return next;
}

const BODY_PROFILE_KEY = 'fittrack_body_profile';

export async function getBodyProfile(): Promise<import('@/lib/body-profile').BodyProfile> {
  await delay();
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BODY_PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as import('@/lib/body-profile').BodyProfile;
  } catch {
    return {};
  }
}

export async function getAthleteBodyProfile(athleteId: string): Promise<import('@/lib/body-profile').BodyProfile> {
  await delay();
  const athlete = findAthlete(athleteId);
  if (!athlete) return {};
  const sex = athlete.gender === 'F' || athlete.gender === 'female' ? 'female' : athlete.gender === 'M' || athlete.gender === 'male' ? 'male' : undefined;
  return {
    heightCm: athlete.height || undefined,
    age: athlete.age || undefined,
    sex,
  };
}

export async function updateBodyProfile(
  patch: import('@/lib/body-profile').BodyProfile,
): Promise<import('@/lib/body-profile').BodyProfile> {
  await delay();
  const current = await getBodyProfile();
  const merged = { ...current, ...patch };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BODY_PROFILE_KEY, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
  }
  return merged;
}
