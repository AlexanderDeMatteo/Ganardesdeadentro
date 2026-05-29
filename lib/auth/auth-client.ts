import { isApiAuthSource } from '@/lib/api/config';
import { localAuthClient } from '@/lib/auth/auth-client.local';
import { remoteAuthClient } from '@/lib/auth/auth-client.remote';
import type { AuthClient } from '@/lib/auth/auth-types';

export function getAuthClient(): AuthClient {
  return isApiAuthSource() ? remoteAuthClient : localAuthClient;
}
