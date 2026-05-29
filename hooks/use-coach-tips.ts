'use client';

import { useCoach } from '@/app/context/coach-context';

export type { CoachMood, CoachTip } from '@/lib/coach/types';

export function useCoachTips() {
  return useCoach();
}
