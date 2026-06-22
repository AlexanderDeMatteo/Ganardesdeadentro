'use client';

import type { MembershipPlan } from '@/hooks/use-memberships';
import { listPublicMembershipPlans } from '@/lib/data/client';
import { useCallback, useEffect, useState } from 'react';

export function usePublicMembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPublicMembershipPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las membresías');
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { plans, isLoading, error, reload };
}
