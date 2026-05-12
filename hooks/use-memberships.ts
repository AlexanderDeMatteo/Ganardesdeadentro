'use client';

import { useState, useCallback, useEffect } from 'react';

export interface MembershipPlan {
  id: string;
  name: 'Básica' | 'Premium' | 'Pro';
  price: number;
  description: string;
  features: string[];
  durationDays: number;
  color: 'blue' | 'purple' | 'amber';
  createdAt: string;
}

const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: '1',
    name: 'Básica',
    price: 9.99,
    description: 'Acceso a rutinas básicas y seguimiento de peso',
    features: [
      'Rutinas prehechas',
      'Seguimiento de peso',
      'Comunidad',
    ],
    durationDays: 30,
    color: 'blue',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Premium',
    price: 29.99,
    description: 'Rutinas personalizadas con seguimiento completo de métricas',
    features: [
      'Rutinas personalizadas',
      'Seguimiento completo de métricas',
      'Chat con entrenador',
      'Ajustes de rutina mensuales',
    ],
    durationDays: 30,
    color: 'purple',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pro',
    price: 59.99,
    description: 'Acceso total con sesiones privadas y plan nutricional',
    features: [
      'Todo de Premium',
      'Sesiones privadas semanales',
      'Plan nutricional personalizado',
      'Videoconferencias ilimitadas',
      'Análisis de progreso detallado',
    ],
    durationDays: 30,
    color: 'amber',
    createdAt: new Date().toISOString(),
  },
];

export function useMemberships() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STORAGE_KEY = 'fitness_membership_plans';

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPlans(JSON.parse(stored));
      } catch {
        setPlans(DEFAULT_MEMBERSHIP_PLANS);
      }
    } else {
      setPlans(DEFAULT_MEMBERSHIP_PLANS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
    }
    setIsLoading(false);
  }, []);

  const createPlan = useCallback((plan: Omit<MembershipPlan, 'id' | 'createdAt'>) => {
    const newPlan: MembershipPlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    return newPlan;
  }, [plans]);

  const updatePlan = useCallback((id: string, updates: Partial<MembershipPlan>) => {
    const updatedPlans = plans.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setPlans(updatedPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
  }, [plans]);

  const deletePlan = useCallback((id: string) => {
    const updatedPlans = plans.filter(p => p.id !== id);
    setPlans(updatedPlans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
  }, [plans]);

  const getPlanById = useCallback((id: string) => {
    return plans.find(p => p.id === id);
  }, [plans]);

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
  };
}
