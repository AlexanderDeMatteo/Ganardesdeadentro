import { ApiNotImplementedError } from '@/lib/api/errors';
import type { Membership } from '@/app/context/auth-context';
import type { MembershipPlan } from '@/hooks/use-memberships';
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
import type { AssignedNutritionPlan, CoachNutritionDraft } from '@/lib/nutrition/types';

function notImplemented(endpoint: string): never {
  throw new ApiNotImplementedError(endpoint);
}

export function membershipLevelToPlanId(
  level: Athlete['membershipLevel'],
): string {
  return notImplemented('GET /api/memberships/plan-map');
}

export function membershipNameToPlanId(name: Membership['name']): string {
  return notImplemented('GET /api/memberships/plan-map');
}

export async function getMyRoutine(athleteId: string): Promise<{
  routine: Routine;
  assignment: RoutineAssignment;
} | null> {
  return notImplemented('GET /api/routines/my');
}

export async function getAthleteMetrics(athleteId: string): Promise<Metric[]> {
  return notImplemented('GET /api/metrics');
}

export async function addMetric(
  athleteId: string,
  metric: Omit<Metric, 'id' | 'athleteId'>,
): Promise<Metric> {
  return notImplemented('POST /api/metrics');
}

export async function updateMetric(
  id: string,
  patch: Partial<Omit<Metric, 'id' | 'athleteId'>>,
): Promise<Metric | null> {
  return notImplemented('PATCH /api/metrics/:id');
}

export async function removeMetric(id: string): Promise<void> {
  return notImplemented('DELETE /api/metrics/:id');
}

export async function getMealPlan(athleteId: string): Promise<AssignedNutritionPlan | null> {
  return notImplemented('GET /api/nutrition/plan');
}

export async function markSessionComplete(
  athleteId: string,
  payload: Omit<SessionLog, 'id' | 'athleteId' | 'date'> & { date?: string },
): Promise<SessionLog> {
  return notImplemented('POST /api/sessions/complete');
}

export async function getAthleteSessionLogs(athleteId: string): Promise<SessionLog[]> {
  return notImplemented('GET /api/sessions');
}

export async function getSessionLogsForWeek(
  athleteId: string,
  weekStart: string,
): Promise<SessionLog[]> {
  return notImplemented('GET /api/sessions/week');
}

export async function getExerciseProgress(
  athleteId: string,
  exerciseId: string,
): Promise<Array<{ date: string; maxWeightKg: number; sessionId: string }>> {
  return notImplemented('GET /api/sessions/progress');
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  return notImplemented('GET /api/routines/:id');
}

export async function getWeeklyPlan(athleteId: string): Promise<WeeklyPlan | null> {
  return notImplemented('GET /api/routines/weekly-plan');
}

export async function assignWeeklyPlan(
  athleteId: string,
  trainerId: string,
  days: WeeklyPlanDay[],
  weekStartDate?: string,
): Promise<WeeklyPlan> {
  return notImplemented('PUT /api/routines/weekly-plan');
}

export async function getMyTrainer(athleteId: string): Promise<Trainer | null> {
  return notImplemented('GET /api/users/my-trainer');
}

export async function getMembership(athleteId: string): Promise<{
  level: Athlete['membershipLevel'];
  planId: string;
} | null> {
  return notImplemented('GET /api/memberships/active');
}

export async function assignRoutine(
  athleteId: string,
  routineId: string,
  trainerId: string,
): Promise<RoutineAssignment> {
  return notImplemented('POST /api/routines/assignments');
}

export async function unassignRoutine(assignmentId: string): Promise<void> {
  return notImplemented('DELETE /api/routines/assignments/:id');
}

export async function getTrainerAthletes(trainerId: string): Promise<Athlete[]> {
  return notImplemented('GET /api/users/trainer-athletes');
}

export async function getAdminOverview(): Promise<{
  trainerCount: number;
  athleteCount: number;
  assignmentCount: number;
  athletesWithoutTrainer: number;
  trainersWithoutAthletes: number;
}> {
  return notImplemented('GET /api/admin/overview');
}

export async function getAthleteById(athleteId: string): Promise<Athlete | null> {
  return notImplemented('GET /api/users/athletes/:id');
}

export async function getTrainerById(trainerId: string): Promise<Trainer | null> {
  return notImplemented('GET /api/users/trainers/:id');
}

export async function updateAthlete(
  athleteId: string,
  patch: Partial<Athlete>,
): Promise<void> {
  return notImplemented('PATCH /api/users/athletes/:id');
}

export async function assignTrainerToAthlete(
  athleteId: string,
  trainerId: string,
): Promise<void> {
  return notImplemented('PUT /api/users/athletes/:id/trainer');
}

export async function createRoutine(
  routine: Omit<Routine, 'id' | 'createdDate'>,
  trainerId?: string,
): Promise<Routine> {
  return notImplemented('POST /api/routines');
}

export async function deleteRoutine(routineId: string): Promise<void> {
  return notImplemented('DELETE /api/routines/:id');
}

export async function updateRoutine(
  routineId: string,
  patch: Partial<Routine>,
): Promise<void> {
  return notImplemented('PATCH /api/routines/:id');
}

export async function updateTrainerProfile(
  trainerId: string,
  patch: { specialization?: string; bio?: string },
): Promise<void> {
  return notImplemented('PATCH /api/users/trainers/:id');
}

export function getStateSnapshot(): never {
  throw new Error('getStateSnapshot no está disponible con DATA_SOURCE=api.');
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  return notImplemented('GET /api/memberships/plans');
}

export async function createMembershipPlan(
  plan: Omit<MembershipPlan, 'id' | 'createdAt'>,
): Promise<MembershipPlan> {
  return notImplemented('POST /api/memberships/plans');
}

export async function deleteMembershipPlan(id: string): Promise<void> {
  return notImplemented('DELETE /api/memberships/plans/:id');
}

export async function updateMembershipPlan(
  id: string,
  updates: Partial<Omit<MembershipPlan, 'id' | 'createdAt'>>,
): Promise<MembershipPlan | null> {
  return notImplemented('PATCH /api/memberships/plans/:id');
}

export async function publishMealPlan(
  plan: AssignedNutritionPlan,
): Promise<AssignedNutritionPlan> {
  return notImplemented('PUT /api/nutrition/plan');
}

export async function getCoachNutritionDraft(athleteId: string): Promise<CoachNutritionDraft> {
  return notImplemented('GET /api/nutrition/coach-draft');
}

export async function saveCoachNutritionDraft(
  athleteId: string,
  draft: CoachNutritionDraft,
): Promise<CoachNutritionDraft> {
  return notImplemented('PUT /api/nutrition/coach-draft');
}
