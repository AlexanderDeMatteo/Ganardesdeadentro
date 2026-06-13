export type AuthSource = 'local' | 'api';
export type DataSource = 'local' | 'api';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';
}

/** Base URL for server-side fetch (Route Handlers). Prefer internal Docker URL when set. */
export function getServerApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL?.trim();
  if (internal) {
    return internal.replace(/\/$/, '');
  }
  return getApiBaseUrl();
}

export function getAuthSource(): AuthSource {
  const value = process.env.NEXT_PUBLIC_AUTH_SOURCE;
  return value === 'api' ? 'api' : 'local';
}

export function getDataSource(): DataSource {
  const value = process.env.NEXT_PUBLIC_DATA_SOURCE;
  return value === 'api' ? 'api' : 'local';
}

export function getMetricsDataSource(): DataSource {
  const override = process.env.NEXT_PUBLIC_DATA_SOURCE_METRICS;
  if (override === 'api' || override === 'local') {
    return override;
  }
  return getDataSource();
}

export function getRoutinesDataSource(): DataSource {
  const override = process.env.NEXT_PUBLIC_DATA_SOURCE_ROUTINES;
  if (override === 'api' || override === 'local') {
    return override;
  }
  return getDataSource();
}

export function getUsersDataSource(): DataSource {
  const override = process.env.NEXT_PUBLIC_DATA_SOURCE_USERS;
  if (override === 'api' || override === 'local') {
    return override;
  }
  return getDataSource();
}

export function getNutritionDataSource(): DataSource {
  const override = process.env.NEXT_PUBLIC_DATA_SOURCE_NUTRITION;
  if (override === 'api' || override === 'local') {
    return override;
  }
  return getDataSource();
}

export function getMembershipsDataSource(): DataSource {
  const override = process.env.NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS;
  if (override === 'api' || override === 'local') {
    return override;
  }
  return getDataSource();
}

export function isApiDataSource(): boolean {
  return getDataSource() === 'api';
}

export function isApiMetricsSource(): boolean {
  return getMetricsDataSource() === 'api';
}

export function isApiRoutinesSource(): boolean {
  return getRoutinesDataSource() === 'api';
}

export function isApiUsersSource(): boolean {
  return getUsersDataSource() === 'api';
}

export function isApiNutritionSource(): boolean {
  return getNutritionDataSource() === 'api';
}

export function isApiMembershipsSource(): boolean {
  return getMembershipsDataSource() === 'api';
}

export function isApiAuthSource(): boolean {
  return getAuthSource() === 'api';
}

export function isFullApiMode(): boolean {
  return (
    isApiAuthSource() &&
    isApiMetricsSource() &&
    isApiRoutinesSource() &&
    isApiUsersSource() &&
    isApiNutritionSource() &&
    isApiMembershipsSource()
  );
}

export function isDevDataSnapshotEnabled(): boolean {
  return getDataSource() === 'local' && process.env.NODE_ENV !== 'production';
}
