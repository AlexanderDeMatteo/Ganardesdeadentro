/**
 * Facade del cliente de datos. Resuelve contra adaptador local o remoto
 * según NEXT_PUBLIC_DATA_SOURCE (default: local).
 * Dominios pueden usar overrides independientes (METRICS, ROUTINES, USERS, etc.).
 */
import {
  isApiAuthSource,
  isApiDataSource,
  isApiMembershipsSource,
  isApiMetricsSource,
  isApiNutritionSource,
  isApiRoutinesSource,
  isApiUsersSource,
} from '@/lib/api/config';
import * as localClient from '@/lib/data/client.local';
import * as remoteClient from '@/lib/data/client.remote';

const client = isApiDataSource() ? remoteClient : localClient;
const metricsClient = isApiMetricsSource() ? remoteClient : localClient;
const routinesClient = isApiRoutinesSource() ? remoteClient : localClient;
const usersClient = isApiUsersSource() ? remoteClient : localClient;
const nutritionClient = isApiNutritionSource() ? remoteClient : localClient;
const membershipsClient = isApiMembershipsSource() ? remoteClient : localClient;
const adminClient =
  isApiAuthSource() || isApiUsersSource() || isApiDataSource()
    ? remoteClient
    : localClient;

export const membershipLevelToPlanId = client.membershipLevelToPlanId;
export const membershipNameToPlanId = client.membershipNameToPlanId;
export const getMyRoutine = routinesClient.getMyRoutine;
export const getAthleteMetrics = metricsClient.getAthleteMetrics;
export const addMetric = metricsClient.addMetric;
export const updateMetric = metricsClient.updateMetric;
export const removeMetric = metricsClient.removeMetric;
export const getMealPlan = nutritionClient.getMealPlan;
export const markSessionComplete = routinesClient.markSessionComplete;
export const getAthleteSessionLogs = routinesClient.getAthleteSessionLogs;
export const getSessionLogsForWeek = routinesClient.getSessionLogsForWeek;
export const getExerciseProgress = routinesClient.getExerciseProgress;
export const getRoutineById = routinesClient.getRoutineById;
export const getWeeklyPlan = routinesClient.getWeeklyPlan;
export const assignWeeklyPlan = routinesClient.assignWeeklyPlan;
export const getMyTrainer = usersClient.getMyTrainer;
export const getMembership = membershipsClient.getMembership;
export const subscribeMembership = membershipsClient.subscribeMembership;
export const listExercises = routinesClient.listExercises;
export const searchExercises = routinesClient.searchExercises;
export const listRoutines = routinesClient.listRoutines;
export const listAssignments = routinesClient.listAssignments;
export const assignRoutine = routinesClient.assignRoutine;
export const unassignRoutine = routinesClient.unassignRoutine;
export const getTrainerAthletes = usersClient.getTrainerAthletes;
export const getAdminOverview = adminClient.getAdminOverview;
export const listAdminAthletes = usersClient.listAdminAthletes;
export const listAdminTrainers = usersClient.listAdminTrainers;
export const createAdminTrainer = adminClient.createAdminTrainer;
export const deactivateAdminTrainer = adminClient.deactivateAdminTrainer;
export const reactivateAdminTrainer = adminClient.reactivateAdminTrainer;
export const updateAdminTrainer = adminClient.updateAdminTrainer;
export const resendTrainerInvite = adminClient.resendTrainerInvite;
export const getAthleteById = usersClient.getAthleteById;
export const getTrainerById = usersClient.getTrainerById;
export const updateAthlete = usersClient.updateAthlete;
export const assignTrainerToAthlete = usersClient.assignTrainerToAthlete;
export const unassignTrainerFromAthlete = usersClient.unassignTrainerFromAthlete;
export const createRoutine = routinesClient.createRoutine;
export const deleteRoutine = routinesClient.deleteRoutine;
export const updateRoutine = routinesClient.updateRoutine;
export const updateTrainerProfile = usersClient.updateTrainerProfile;
export const getStateSnapshot = client.getStateSnapshot;
export const listMembershipPlans = membershipsClient.listMembershipPlans;
export const createMembershipPlan = membershipsClient.createMembershipPlan;
export const deleteMembershipPlan = membershipsClient.deleteMembershipPlan;
export const updateMembershipPlan = membershipsClient.updateMembershipPlan;
export const assignUserMembership = membershipsClient.assignUserMembership;
export const publishMealPlan = nutritionClient.publishMealPlan;
export const getCoachNutritionDraft = nutritionClient.getCoachNutritionDraft;
export const saveCoachNutritionDraft = nutritionClient.saveCoachNutritionDraft;
export const getDiary = nutritionClient.getDiary;
export const putDiary = nutritionClient.putDiary;
export const addDiaryEntry = nutritionClient.addDiaryEntry;
export const deleteDiaryEntry = nutritionClient.deleteDiaryEntry;
export const patchDiaryWater = nutritionClient.patchDiaryWater;
export const getBodyProfile = usersClient.getBodyProfile;
export const getAthleteBodyProfile = usersClient.getAthleteBodyProfile;
export const updateBodyProfile = usersClient.updateBodyProfile;
