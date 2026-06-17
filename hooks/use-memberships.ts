'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  createMembershipPlan,
  deleteMembershipPlan,
  listMembershipPlans,
  updateMembershipPlan,
} from '@/lib/data/client';

import type { MembershipLevel } from '@/lib/data/types';

export type MembershipFunctionalTier = MembershipLevel;

export interface MembershipPlan {
  id: string;
  name: string;
  functionalTier: MembershipFunctionalTier;
  price: number;
  description: string;
  features: string[];
  durationDays: number;
  color: 'blue' | 'purple' | 'amber';
  createdAt: string;
}

export function useMemberships() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await listMembershipPlans();
    setPlans(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createPlan = useCallback(
    async (plan: Omit<MembershipPlan, 'id' | 'createdAt'>) => {
      const newPlan = await createMembershipPlan(plan);
      await reload();
      return newPlan;
    },
    [reload],
  );

  const updatePlan = useCallback(
    async (id: string, updates: Partial<MembershipPlan>) => {
      await updateMembershipPlan(id, updates);
      await reload();
    },
    [reload],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      await deleteMembershipPlan(id);
      await reload();
    },
    [reload],
  );

  const getPlanById = useCallback(
    (id: string) => {
      return plans.find((p) => p.id === id);
    },
    [plans],
  );

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
  };
}
