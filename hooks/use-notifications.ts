'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/app/context/auth-context';
import { useRealtime } from '@/app/context/realtime-context';
import type { NotificationRecord } from '@/lib/api/contracts/notifications';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getUnreadNotificationCount,
} from '@/lib/data/client';

export function useNotifications() {
  const { isAuthenticated, refreshSession } = useAuth();
  const { subscribe } = useRealtime();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [items, count] = await Promise.all([
        listNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribe('notification', (payload) => {
      const notification = payload as NotificationRecord;
      if (!notification?.id) return;

      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev];
      });
      if (!notification.readAt) {
        setUnreadCount((prev) => prev + 1);
      }

      toast(notification.title, {
        description: notification.body || undefined,
      });

      if (notification.type === 'payment.approved') {
        void refreshSession();
      }
    });
  }, [refreshSession, subscribe]);

  const markRead = useCallback(async (id: string) => {
    const updated = await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    return updated;
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  };
}
