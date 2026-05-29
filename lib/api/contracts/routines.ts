import type { Athlete, Routine, RoutineAssignment, SessionLog, WeeklyPlan, WeeklyPlanDay } from '@/lib/data/types';

export interface MyRoutineQuery {
  athleteId: string;
}

export interface MyRoutineResponse {
  assignment: RoutineAssignment | null;
  routine: Routine | null;
}

export interface AssignRoutineRequest {
  athleteId: string;
  routineId: string;
  trainerId: string;
}

export type AssignRoutineResponse = RoutineAssignment;

export interface TrainerAthletesParams {
  trainerId: string;
}

export type TrainerAthletesResponse = Athlete[];

export interface AssignWeeklyPlanRequest {
  athleteId: string;
  trainerId: string;
  weekStartDate?: string;
  days: WeeklyPlanDay[];
}

export type AssignWeeklyPlanResponse = WeeklyPlan;

export type CompleteSessionRequest = Omit<SessionLog, 'id' | 'athleteId' | 'date'> & {
  athleteId: string;
  date?: string;
};

export type CompleteSessionResponse = SessionLog;

export interface ExerciseProgressQuery {
  athleteId: string;
  exerciseId: string;
}

export type ExerciseProgressResponse = Array<{
  date: string;
  maxWeightKg: number;
  sessionId: string;
}>;
