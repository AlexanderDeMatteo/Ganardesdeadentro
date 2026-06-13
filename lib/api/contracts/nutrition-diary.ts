import type { AthleteDiaryState, MealItem } from '@/lib/nutrition/types';

export type DiaryResponse = {
  diary: AthleteDiaryState;
};

export type DiaryPutRequest = {
  athleteId: string;
  foodLog: AthleteDiaryState['foodLog'];
  waterByDate: AthleteDiaryState['waterByDate'];
  waterGoalMl: number;
};

export type DiaryEntryPostRequest = {
  athleteId: string;
  date: string;
  item: Omit<MealItem, 'id'> & { id?: string };
};

export type DiaryWaterPatchRequest = {
  athleteId: string;
  date: string;
  ml?: number;
  mlDelta?: number;
  goalMl?: number;
};
