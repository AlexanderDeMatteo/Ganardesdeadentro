export type SupportMessage = {
  id: string;
  athleteId: string;
  senderId: string;
  senderRole: 'user' | 'admin' | 'trainer';
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type SupportThreadAthlete = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type SupportThread = {
  id: string;
  athleteId: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadForAdmin: number;
  unreadForAthlete: number;
  createdAt: string;
  athlete?: SupportThreadAthlete;
};

export type SupportThreadResponse = {
  thread: SupportThread | null;
  messages: SupportMessage[];
};

export type SupportThreadsResponse = {
  threads: SupportThread[];
};

export type SupportMessageResponse = {
  message: SupportMessage;
};
