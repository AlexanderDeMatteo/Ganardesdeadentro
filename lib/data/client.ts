/**
 * Facade del cliente de datos. Resuelve contra adaptador local o remoto
 * según NEXT_PUBLIC_DATA_SOURCE (default: local).
 */
import { isApiDataSource } from '@/lib/api/config';
import * as localClient from '@/lib/data/client.local';
import * as remoteClient from '@/lib/data/client.remote';

const client = isApiDataSource() ? remoteClient : localClient;

export const membershipLevelToPlanId = client.membershipLevelToPlanId;
export const membershipNameToPlanId = client.membershipNameToPlanId;
export const getMyRoutine = client.getMyRoutine;
export const getAthleteMetrics = client.getAthleteMetrics;
export const addMetric = client.addMetric;
export const updateMetric = client.updateMetric;
export const removeMetric = client.removeMetric;
export const getMealPlan = client.getMealPlan;
export const markSessionComplete = client.markSessionComplete;
export const getAthleteSessionLogs = client.getAthleteSessionLogs;
export const getSessionLogsForWeek = client.getSessionLogsForWeek;
export const getExerciseProgress = client.getExerciseProgress;
export const getRoutineById = client.getRoutineById;
export const getWeeklyPlan = client.getWeeklyPlan;
export const assignWeeklyPlan = client.assignWeeklyPlan;
export const getMyTrainer = client.getMyTrainer;
export const getMembership = client.getMembership;
export const assignRoutine = client.assignRoutine;
export const unassignRoutine = client.unassignRoutine;
export const getTrainerAthletes = client.getTrainerAthletes;
export const getAdminOverview = client.getAdminOverview;
export const getAthleteById = client.getAthleteById;
export const getTrainerById = client.getTrainerById;
export const updateAthlete = client.updateAthlete;
export const assignTrainerToAthlete = client.assignTrainerToAthlete;
export const createRoutine = client.createRoutine;
export const deleteRoutine = client.deleteRoutine;
export const updateRoutine = client.updateRoutine;
export const updateTrainerProfile = client.updateTrainerProfile;
export const getStateSnapshot = client.getStateSnapshot;
export const listMembershipPlans = client.listMembershipPlans;
export const createMembershipPlan = client.createMembershipPlan;
export const deleteMembershipPlan = client.deleteMembershipPlan;
export const updateMembershipPlan = client.updateMembershipPlan;
export const publishMealPlan = client.publishMealPlan;
export const getCoachNutritionDraft = client.getCoachNutritionDraft;
export const saveCoachNutritionDraft = client.saveCoachNutritionDraft;
