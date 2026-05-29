export type AuthSource = 'local' | 'api';
export type DataSource = 'local' | 'api';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';
}

export function getAuthSource(): AuthSource {
  const value = process.env.NEXT_PUBLIC_AUTH_SOURCE;
  return value === 'api' ? 'api' : 'local';
}

export function getDataSource(): DataSource {
  const value = process.env.NEXT_PUBLIC_DATA_SOURCE;
  return value === 'api' ? 'api' : 'local';
}

export function isApiDataSource(): boolean {
  return getDataSource() === 'api';
}

export function isApiAuthSource(): boolean {
  return getAuthSource() === 'api';
}

export function isDevDataSnapshotEnabled(): boolean {
  return getDataSource() === 'local' && process.env.NODE_ENV !== 'production';
}
