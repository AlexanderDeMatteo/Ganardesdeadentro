export type NotificationRecord = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  notifications: NotificationRecord[];
};

export type UnreadCountResponse = {
  count: number;
};
