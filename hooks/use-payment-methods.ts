'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaymentMethod } from '@/lib/api/contracts/payments';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listAllPaymentMethods,
  updatePaymentMethod,
} from '@/lib/data/client';

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllPaymentMethods();
      setMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los métodos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    methods,
    isLoading,
    error,
    refresh,
    createMethod: async (data: {
      name: string;
      category: string;
      methodType: 'digital' | 'bank' | 'crypto' | 'cash';
      exchangeRateId: string | null;
      details: Array<{ key: string; value: string }>;
      sortOrder: number;
      isActive: boolean;
    }) => {
      await createPaymentMethod(data);
      await refresh();
    },
    updateMethod: async (
      id: string,
      data: Partial<{
        name: string;
        category: string;
        methodType: 'digital' | 'bank' | 'crypto' | 'cash';
        exchangeRateId: string | null;
        details: Array<{ key: string; value: string }>;
        sortOrder: number;
        isActive: boolean;
      }>,
    ) => {
      await updatePaymentMethod(id, data);
      await refresh();
    },
    deleteMethod: async (id: string) => {
      await deletePaymentMethod(id);
      await refresh();
    },
  };
}
