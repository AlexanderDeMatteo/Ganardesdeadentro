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

export interface CreateTrainerInviteRequest {
  email: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

export interface CreateTrainerInviteResponse {
  trainer: import('@/lib/data/types').Trainer;
  message: string;
}

export type AthleteTrainerAction = {
  athleteId: string;
  action: 'reassign' | 'unassign';
  newTrainerId?: string;
};

export interface DeactivateTrainerRequest {
  athleteActions: AthleteTrainerAction[];
}
