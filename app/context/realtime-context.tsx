'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/app/context/auth-context';
import { disconnectSocket, getSocket, refreshSocketAuth } from '@/lib/realtime/socket';
import type { Socket } from 'socket.io-client';

type EventHandler = (payload: unknown) => void;

type RealtimeContextValue = {
  subscribe: (event: string, handler: EventHandler) => () => void;
  joinSupportThread: (athleteId: string) => void;
  leaveSupportThread: (athleteId: string) => void;
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((event: string, handler: EventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const dispatch = useCallback((event: string, payload: unknown) => {
    handlersRef.current.get(event)?.forEach((handler) => {
      handler(payload);
    });
  }, []);

  const joinSupportThread = useCallback((athleteId: string) => {
    socketRef.current?.emit('support:join', { athleteId });
  }, []);

  const leaveSupportThread = useCallback((athleteId: string) => {
    socketRef.current?.emit('support:leave', { athleteId });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    refreshSocketAuth();
    const socket = getSocket();
    if (!socket) return;

    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };
    const onNotification = (payload: unknown) => dispatch('notification', payload);
    const onSupportMessage = (payload: unknown) => dispatch('support:message', payload);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);
    socket.on('support:message', onSupportMessage);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
      socket.off('support:message', onSupportMessage);
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [dispatch, isAuthenticated, user?.id]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      subscribe,
      joinSupportThread,
      leaveSupportThread,
      isConnected,
    }),
    [isConnected, joinSupportThread, leaveSupportThread, subscribe],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
