import type { Athlete, Trainer } from '@/lib/data/types';

export interface AdminOverviewResponse {
  trainerCount: number;
  athleteCount: number;
  assignmentCount: number;
  athletesWithoutTrainer: number;
  trainersWithoutAthletes: number;
}

export type UpdateAthleteRequest = Partial<Athlete>;

export type UpdateAthleteResponse = Athlete;

export interface AssignTrainerRequest {
  athleteId: string;
  trainerId: string;
}

export interface UpdateTrainerProfileRequest {
  specialization?: string;
  bio?: string;
}
