'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ExchangeRate } from '@/lib/api/contracts/exchange-rates';
import {
  createExchangeRate,
  deleteExchangeRate,
  listExchangeRates,
  listPublicExchangeRates,
  updateExchangeRate,
} from '@/lib/data/client';

export function useExchangeRates(publicOnly = false) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = publicOnly ? await listPublicExchangeRates() : await listExchangeRates();
      setRates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las tasas');
    } finally {
      setIsLoading(false);
    }
  }, [publicOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    rates,
    isLoading,
    error,
    refresh,
    createRate: async (data: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>) => {
      await createExchangeRate(data);
      await refresh();
    },
    updateRate: async (
      id: string,
      data: Partial<Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>>,
    ) => {
      await updateExchangeRate(id, data);
      await refresh();
    },
    deleteRate: async (id: string) => {
      await deleteExchangeRate(id);
      await refresh();
    },
  };
}
