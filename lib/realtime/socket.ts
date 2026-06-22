import { io, type Socket } from 'socket.io-client';

import { getApiBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/session-store';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAccessToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (socket && !socket.connected) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(getApiBaseUrl(), {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    auth: { token },
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function refreshSocketAuth(): void {
  const token = getAccessToken();
  if (!socket) return;
  socket.auth = { token };
  if (token && !socket.connected) {
    socket.connect();
  }
  if (!token && socket.connected) {
    socket.disconnect();
  }
}
