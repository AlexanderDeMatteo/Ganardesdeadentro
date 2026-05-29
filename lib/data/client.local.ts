import type { Membership } from '@/app/context/auth-context';
import { isDevDataSnapshotEnabled } from '@/lib/api/config';
import { getDataState, setDataState } from '@/lib/data/store';
import type {
  Athlete,
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
import type { AssignedNutritionPlan, CoachNutritionDraft } from '@/lib/nutrition/types';
import { getMondayOfWeek } from '@/lib/workout/session-utils';

const delay = () => new Promise<void>((r) => setTimeout(r, 0));

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
  return getDataState().athletes.filter((a) => a.trainerId === trainerId);
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

export async function assignTrainerToAthlete(athleteId: string, trainerId: string): Promise<void> {
  await delay();
  setDataState((prev) => {
    const oldTrainerId = prev.athletes.find((a) => a.id === athleteId)?.trainerId;
    const athletes = prev.athletes.map((a) =>
      a.id === athleteId ? { ...a, trainerId } : a,
    );
    const trainers = prev.trainers.map((t) => {
      if (t.id === trainerId) return { ...t, athletes: t.athletes + 1 };
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
