'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaymentRequest } from '@/lib/api/contracts/payments';
import { approvePaymentRequest, listPaymentRequests, rejectPaymentRequest } from '@/lib/data/client';

export function usePaymentRequests(status?: string) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPaymentRequests(status);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    requests,
    isLoading,
    error,
    refresh,
    approve: async (id: string) => {
      await approvePaymentRequest(id);
      await refresh();
    },
    reject: async (id: string, reason?: string) => {
      await rejectPaymentRequest(id, reason);
      await refresh();
    },
  };
}
