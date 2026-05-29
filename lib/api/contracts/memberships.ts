import type { MembershipPlan } from '@/hooks/use-memberships';

export type MembershipPlansListResponse = MembershipPlan[];

export type CreateMembershipPlanRequest = Omit<MembershipPlan, 'id' | 'createdAt'>;

export type CreateMembershipPlanResponse = MembershipPlan;

export interface CurrentMembershipQuery {
  athleteId: string;
}

export interface CurrentMembershipResponse {
  level: 'basic' | 'premium' | 'pro';
  planId: string;
}
