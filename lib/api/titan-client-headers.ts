import { getAccessToken } from '@/lib/auth/session-store';

/**
 * Headers de sesión para rutas Titan.
 * Usa session-store como único punto de acceso al token.
 */
export function getTitanAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export function getTitanMembershipPayload(user: {
  role?: string;
  membership?: { name?: string };
} | null): { membershipTier?: string; userRole?: string } {
  if (!user) {
    return {};
  }

  return {
    membershipTier: user.membership?.name,
    userRole: user.role,
  };
}
