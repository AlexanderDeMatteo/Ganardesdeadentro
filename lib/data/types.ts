import type { Membership } from '@/app/context/auth-context';
import type { MembershipPlan } from '@/hooks/use-memberships';
import type { AssignedNutritionPlan, MealPlan } from '@/lib/nutrition/types';

export type { Membership, MembershipPlan, MealPlan, AssignedNutritionPlan };

export type MembershipLevel = 'basic' | 'premium' | 'pro';
export type Difficulty = 'beginner' | 'intermediate' | 'expert';
export type BodyFatSource = 'manual' | 'estimated';
export type MuscleMassSource = 'manual' | 'estimated';
export type SetResult = 'completed' | 'failed' | 'skipped';
export type SessionOutcome = 'completed' | 'abandoned';

export interface Athlete {
  id: string;
  userId?: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  joinDate: string;
  trainerId?: string;
  membershipLevel: MembershipLevel;
  membershipId?: string;
  metrics?: {
    weight: number;
    bodyFat: number;
    muscleMass: number;
  };
  latestMetric?: {
    weight: number;
    bodyFat: number;
    muscleMass: number;
    date?: string;
  };
}

/** @deprecated Use Athlete — kept for backward compatibility with existing imports */
export type AthleteProfile = Athlete;

export interface Trainer {
  id: string;
  name: string;
  email: string;
  specialization: string;
  bio?: string;
  athletes: number;
  rating: number;
  joinDate: string;
  adminId?: string;
  isActive?: boolean;
  invitePending?: boolean;
  maxAthletes?: number;
}

export type ExerciseAnimationType = 'gif' | 'video' | 'none';
export type ExerciseAnimationSource = 'exercisedb' | 'upload' | 'none';

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  difficulty: Difficulty;
  equipment: string;
  description?: string;
  animationUrl?: string;
  animationType?: ExerciseAnimationType;
  animationSource?: ExerciseAnimationSource;
  isCustom?: boolean;
  createdById?: number;
}

export type RoutineStructureType = 'standard' | 'series_pull' | 'superset';
export type SupersetSubtype = 'progressive' | 'regressive';

export interface RomRange {
  from: string;
  to: string;
  repsMin: number;
  repsMax: number;
}

export interface SupersetStep {
  weightKg: number;
  repsTarget: string;
}

export interface SupersetFinisher {
  weightKg: number;
  repsTarget: string;
}

export interface RoutineExerciseBlockConfig {
  romRanges?: RomRange[];
  supersetSubtype?: SupersetSubtype;
  steps?: SupersetStep[];
  finisher?: SupersetFinisher;
  maxTransitionRestSec?: number;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  rest: number;
  /** Peso sugerido por serie (length === sets). Opcional. */
  suggestedWeightsKg?: number[];
  technique?: string;
  blockConfig?: RoutineExerciseBlockConfig;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  structureType?: RoutineStructureType;
  exercises: RoutineExercise[];
  createdDate: string;
  trainerId?: string;
}

export interface RoutineAssignment {
  id: string;
  athleteId: string;
  routineId: string;
  trainerId: string;
  assignedDate: string;
  isActive: boolean;
  /** @deprecated Use isActive — kept for migration from isCompleted */
  isCompleted?: boolean;
}

export interface Metric {
  id: string;
  athleteId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  bodyFatSource?: BodyFatSource;
  muscleMass?: number;
  muscleMassSource?: MuscleMassSource;
  bicepsLeft?: number;
  bicepsRight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  notes?: string;
}

/** @deprecated Use Metric — kept for backward compatibility */
export type MetricEntry = Metric;

export interface SetLogEntry {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  repsTarget: string;
  repsLogged?: string;
  weightKg?: number;
  suggestedWeightKg?: number;
  result: SetResult;
  executionVideoUrl?: string;
  executionVideoUploadedAt?: string;
}

export interface SessionLog {
  id: string;
  athleteId: string;
  routineId: string;
  assignmentId?: string;
  weekPlanId?: string;
  scheduledDate: string;
  date: string;
  setLogs: SetLogEntry[];
  completed: boolean;
  completedSets: number;
  failedSets: number;
  totalSets: number;
  sessionOutcome: SessionOutcome;
  /** @deprecated Legacy aggregate — kept for migrated logs */
  completedExerciseIds?: string[];
}

export interface WeeklyPlanDay {
  dayIndex: number;
  label: string;
  routineId: string | null;
  focus?: string;
}

export interface WeeklyPlan {
  id: string;
  athleteId: string;
  trainerId: string;
  weekStartDate: string;
  days: WeeklyPlanDay[];
  createdAt: string;
  isActive: boolean;
}

export interface FitTrackState {
  version: 1;
  dataSchemaVersion?: number;
  athletes: Athlete[];
  trainers: Trainer[];
  exercises: Exercise[];
  routines: Routine[];
  assignments: RoutineAssignment[];
  metrics: Metric[];
  sessionLogs: SessionLog[];
  weeklyPlans: WeeklyPlan[];
}

export const FITTRACK_STATE_KEY = 'fittrack_state_v1';
export const FITTRACK_STATE_VERSION = 1 as const;
export const FITTRACK_DATA_SCHEMA_VERSION = 2 as const;

export const WEEK_DAY_LABELS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'] as const;

export function createEmptyState(): FitTrackState {
  return {
    version: FITTRACK_STATE_VERSION,
    dataSchemaVersion: FITTRACK_DATA_SCHEMA_VERSION,
    athletes: [],
    trainers: [],
    exercises: [],
    routines: [],
    assignments: [],
    metrics: [],
    sessionLogs: [],
    weeklyPlans: [],
  };
}
