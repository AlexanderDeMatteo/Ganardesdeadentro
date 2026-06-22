'use client';

import type { PaymentMethod, PaymentRequest } from '@/lib/api/contracts/payments';
import { isApiMembershipsSource } from '@/lib/api/config';
import {
  getMyPaymentRequests,
  listPaymentMethods,
  submitPaymentRequest,
} from '@/lib/data/client';
import { useCallback, useEffect, useState } from 'react';

const LOCAL_METHODS_KEY = 'fittrack_payment_methods';
const LOCAL_REQUESTS_KEY = 'fittrack_payment_requests';

function loadLocalMethods(): PaymentMethod[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_METHODS_KEY);
    if (raw) return JSON.parse(raw) as PaymentMethod[];
  } catch {
    /* ignore */
  }
  return [
    {
      id: '1',
      name: 'BINANCE',
      slug: 'binance',
      category: 'Criptomonedas',
      methodType: 'crypto',
      exchangeRateId: null,
      details: [{ key: 'wallet', value: 'USDT-TRC20-DEMO' }],
      exchangeRate: null,
      sortOrder: 0,
      isActive: true,
      instructions: 'Envía el pago a la wallet USDT indicada por soporte.',
    },
    {
      id: '2',
      name: 'ZELLE',
      slug: 'zelle',
      category: 'Transferencia digital',
      methodType: 'digital',
      exchangeRateId: null,
      details: [{ key: 'correo', value: 'zelle@ejemplo.com' }],
      exchangeRate: null,
      sortOrder: 1,
      isActive: true,
      instructions: 'Transfiere a zelle@ejemplo.com con tu nombre en la referencia.',
    },
  ];
}

function loadLocalRequests(userId: string): PaymentRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    const all = raw ? (JSON.parse(raw) as PaymentRequest[]) : [];
    return all.filter((r) => r.userId === userId);
  } catch {
    return [];
  }
}

function saveLocalRequest(request: PaymentRequest) {
  const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
  const all = raw ? (JSON.parse(raw) as PaymentRequest[]) : [];
  all.unshift(request);
  localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(all));
}

export function usePaymentCheckout(userId?: string) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loadedMethods, loadedRequests] = await Promise.all([
        listPaymentMethods(),
        userId ? getMyPaymentRequests() : Promise.resolve([]),
      ]);
      setMethods(loadedMethods);
      setRequests(loadedRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos de pago');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingRequest = requests.find((r) => r.status === 'pending');

  return {
    methods,
    requests,
    pendingRequest,
    isLoading,
    error,
    refresh,
    submit: submitPaymentRequest,
    isApiMode: isApiMembershipsSource(),
    loadLocalMethods,
    loadLocalRequests,
    saveLocalRequest,
  };
}
