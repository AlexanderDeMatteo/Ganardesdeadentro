import { isFullApiMode } from '@/lib/api/config';
import {
  createEmptyState,
  FITTRACK_DATA_SCHEMA_VERSION,
  FITTRACK_STATE_KEY,
  WEEK_DAY_LABELS,
  type FitTrackState,
  type Metric,
  type Routine,
  type RoutineAssignment,
  type SessionLog,
  type WeeklyPlan,
} from '@/lib/data/types';
import {
  SEED_ATHLETES,
  SEED_EXERCISES,
  SEED_ROUTINES,
  SEED_TRAINERS,
} from '@/lib/data/seeds';
import { getMondayOfWeek } from '@/lib/workout/session-utils';

const ADMIN_DATA_KEY = 'admin_data';
const TRAINER_DATA_KEY = 'trainer_data';
const METRICS_KEY = 'fittrack_metrics';

type LegacyTrainerStorageEntry = {
  routines?: Routine[];
  assignments?: Array<{
    id: string;
    athleteId: string;
    routineId: string;
    assignedDate: string;
    isCompleted?: boolean;
  }>;
  profile?: { specialization?: string; bio?: string };
};

type LegacyTrainerStorage = Record<string, LegacyTrainerStorageEntry>;

function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }
  return Array.from(map.values());
}

function resolveDefaultAthleteId(): string {
  if (typeof window === 'undefined') return '1';
  try {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw) as { id?: string; email?: string; role?: string };
      if (user.role === 'user') {
        const athletes = loadAdminAthletes();
        const byEmail = athletes.find((a) => a.email.toLowerCase() === (user.email ?? '').toLowerCase());
        if (byEmail) return byEmail.id;
        const byId = athletes.find((a) => a.id === user.id);
        if (byId) return byId.id;
        return user.id ?? '1';
      }
    }
  } catch {
    /* fallback */
  }
  return '1';
}

function loadAdminAthletes() {
  if (typeof window === 'undefined') return SEED_ATHLETES;
  try {
    const saved = localStorage.getItem(ADMIN_DATA_KEY);
    if (saved) {
      const data = JSON.parse(saved) as { athletes?: typeof SEED_ATHLETES };
      if (Array.isArray(data.athletes) && data.athletes.length > 0) return data.athletes;
    }
  } catch {
    /* use seeds */
  }
  return SEED_ATHLETES;
}

function normalizeSessionLog(raw: Partial<SessionLog> & { athleteId: string; routineId: string; id: string }): SessionLog {
  const date = raw.date ?? new Date().toISOString();
  return {
    id: raw.id,
    athleteId: raw.athleteId,
    routineId: raw.routineId,
    assignmentId: raw.assignmentId,
    weekPlanId: raw.weekPlanId,
    scheduledDate: raw.scheduledDate ?? date.split('T')[0],
    date,
    setLogs: raw.setLogs ?? [],
    completed: raw.completed ?? false,
    completedSets: raw.completedSets ?? 0,
    failedSets: raw.failedSets ?? 0,
    totalSets: raw.totalSets ?? 0,
    sessionOutcome: raw.sessionOutcome ?? (raw.completed ? 'completed' : 'abandoned'),
    completedExerciseIds: raw.completedExerciseIds,
  };
}

function seedWeeklyPlan(state: FitTrackState): WeeklyPlan | null {
  if (state.routines.length < 2) return null;
  const weekStart = getMondayOfWeek();
  return {
    id: 'seed-weekly-1',
    athleteId: '1',
    trainerId: '1',
    weekStartDate: weekStart,
    createdAt: new Date().toISOString(),
    isActive: true,
    days: WEEK_DAY_LABELS.map((label, dayIndex) => ({
      dayIndex,
      label,
      routineId:
        dayIndex === 0 || dayIndex === 2
          ? state.routines[0].id
          : dayIndex === 1 || dayIndex === 4
            ? state.routines[1]?.id ?? null
            : null,
      focus:
        dayIndex === 0
          ? 'Tren superior'
          : dayIndex === 1
            ? 'Piernas'
            : dayIndex === 2
              ? 'Empuje'
              : dayIndex === 4
                ? 'Piernas'
                : dayIndex === 6
                  ? 'Descanso'
                  : undefined,
    })),
  };
}

export function normalizeFitTrackState(raw: Partial<FitTrackState>): FitTrackState {
  const base = createEmptyState();
  const state: FitTrackState = {
    ...base,
    ...raw,
    version: 1,
    dataSchemaVersion: FITTRACK_DATA_SCHEMA_VERSION,
    athletes: raw.athletes ?? base.athletes,
    trainers: raw.trainers ?? base.trainers,
    exercises: raw.exercises ?? base.exercises,
    routines: raw.routines ?? base.routines,
    assignments: raw.assignments ?? base.assignments,
    metrics: raw.metrics ?? base.metrics,
    sessionLogs: (raw.sessionLogs ?? []).map((log) =>
      normalizeSessionLog(log as SessionLog),
    ),
    weeklyPlans: raw.weeklyPlans ?? [],
  };

  if (state.weeklyPlans.length === 0) {
    const demo = seedWeeklyPlan(state);
    if (demo) state.weeklyPlans.push(demo);
  }

  return state;
}

function migrateFromLegacy(): FitTrackState {
  const state = createEmptyState();
  state.athletes = [...SEED_ATHLETES];
  state.trainers = [...SEED_TRAINERS];
  state.exercises = [...SEED_EXERCISES];
  state.routines = [...SEED_ROUTINES];

  if (typeof window === 'undefined') return normalizeFitTrackState(state);

  try {
    const adminRaw = localStorage.getItem(ADMIN_DATA_KEY);
    if (adminRaw) {
      const adminData = JSON.parse(adminRaw) as {
        athletes?: FitTrackState['athletes'];
        routines?: Routine[];
      };
      if (Array.isArray(adminData.athletes) && adminData.athletes.length > 0) {
        state.athletes = adminData.athletes.map((a) => ({
          ...a,
          membershipLevel: a.membershipLevel ?? 'basic',
        }));
      }
      if (Array.isArray(adminData.routines) && adminData.routines.length > 0) {
        state.routines = mergeUniqueById(state.routines, adminData.routines);
      }
    }
  } catch {
    /* keep seeds */
  }

  try {
    const trainerRaw = localStorage.getItem(TRAINER_DATA_KEY);
    if (trainerRaw) {
      const all: LegacyTrainerStorage = JSON.parse(trainerRaw);
      const mergedRoutines: Routine[] = [];
      const mergedAssignments: RoutineAssignment[] = [];

      for (const [trainerId, entry] of Object.entries(all)) {
        if (entry.routines?.length) {
          mergedRoutines.push(
            ...entry.routines.map((r) => ({ ...r, trainerId: r.trainerId ?? trainerId })),
          );
        }
        if (entry.assignments?.length) {
          mergedAssignments.push(
            ...entry.assignments.map((a) => ({
              id: a.id,
              athleteId: a.athleteId,
              routineId: a.routineId,
              trainerId,
              assignedDate: a.assignedDate,
              isActive: a.isCompleted === undefined ? true : !a.isCompleted,
              isCompleted: a.isCompleted,
            })),
          );
        }
        const trainer = state.trainers.find((t) => t.id === trainerId);
        if (trainer && entry.profile) {
          const idx = state.trainers.findIndex((t) => t.id === trainerId);
          state.trainers[idx] = {
            ...trainer,
            specialization: entry.profile.specialization ?? trainer.specialization,
            bio: entry.profile.bio ?? trainer.bio,
          };
        }
      }

      if (mergedRoutines.length > 0) {
        state.routines = mergeUniqueById(state.routines, mergedRoutines);
      }
      if (mergedAssignments.length > 0) {
        state.assignments = mergeUniqueById(state.assignments, mergedAssignments);
      }
    }
  } catch {
    /* keep seeds */
  }

  try {
    const metricsRaw = localStorage.getItem(METRICS_KEY);
    if (metricsRaw) {
      const legacyMetrics = JSON.parse(metricsRaw) as Array<Omit<Metric, 'athleteId'> & { athleteId?: string }>;
      const athleteId = resolveDefaultAthleteId();
      state.metrics = legacyMetrics.map((m) => ({
        ...m,
        athleteId: m.athleteId ?? athleteId,
      }));
    }
  } catch {
    /* no metrics */
  }

  if (state.assignments.length === 0 && state.routines.length > 0) {
    state.assignments.push({
      id: 'seed-assignment-1',
      athleteId: '1',
      routineId: state.routines[0].id,
      trainerId: '1',
      assignedDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });
  }

  return normalizeFitTrackState(state);
}

export function loadFitTrackState(): FitTrackState {
  if (typeof window === 'undefined') {
    if (isFullApiMode()) {
      return createEmptyState();
    }
    return normalizeFitTrackState({
      athletes: [...SEED_ATHLETES],
      trainers: [...SEED_TRAINERS],
      exercises: [...SEED_EXERCISES],
      routines: [...SEED_ROUTINES],
    });
  }

  if (isFullApiMode()) {
    return createEmptyState();
  }

  try {
    const saved = localStorage.getItem(FITTRACK_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<FitTrackState>;
      if (parsed.version === 1) {
        const normalized = normalizeFitTrackState(parsed);
        if ((parsed.dataSchemaVersion ?? 1) < FITTRACK_DATA_SCHEMA_VERSION) {
          persistFitTrackState(normalized);
        }
        return normalized;
      }
    }
  } catch {
    /* migrate */
  }

  const migrated = migrateFromLegacy();
  persistFitTrackState(migrated);
  return migrated;
}

export function persistFitTrackState(state: FitTrackState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FITTRACK_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error persisting fittrack state:', err);
  }
}
