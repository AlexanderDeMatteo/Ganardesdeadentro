import type { Athlete, Trainer } from '@/lib/data/types';

export interface AdminOverviewResponse {
  trainerCount: number;
  athleteCount: number;
  assignmentCount: number;
  athletesWithoutTrainer: number;
  trainersWithoutAthletes: number;
}

export type AtRiskReason = 'expiring' | 'inactive';

export type OperationPriority = 'ALTA' | 'MEDIA' | 'BAJA';

export interface AdminDashboardMetricsResponse {
  memberships: {
    activeCount: number;
    estimatedMrr: number;
    mrrTrendPercent: number;
  };
  capacity: {
    totalSlots: number;
    currentLoad: number;
    loadPercent: number;
    trend7d: Array<{ day: string; load: number }>;
  };
  retention: {
    atRisk: Array<{
      athleteId: string;
      name: string;
      email: string;
      reason: AtRiskReason;
      daysRemaining?: number;
      inactiveDays?: number;
    }>;
  };
  telemetry: {
    workoutsCompletedThisWeek: number;
    metricsLoggedToday: number;
    weeklyBars: Array<{ day: string; count: number }>;
  };
  operations: {
    unassigned: Array<{
      id: string;
      name: string;
      email: string;
      joinDate: string;
      priority: OperationPriority;
    }>;
  };
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
