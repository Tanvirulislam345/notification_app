export type Channel = 'EMAIL' | 'IN_APP' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DLQ';

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  channel: Channel;
  optedIn: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  priority: number;
}

export interface NotificationLog {
  id: string;
  userId: string;
  channel: Channel;
  templateId: string | null;
  status: NotificationStatus;
  payload: {
    recipient?: string;
    subject?: string | null;
    body?: string;
    templateName?: string;
    [k: string]: unknown;
  };
  attempts: number;
  lastAttemptAt: string | null;
  errorMessage: string | null;
  correlationId: string;
  createdAt: string;
}

export interface DeadLetterRecord {
  id: string;
  notificationLogId: string;
  reason: string;
  rawPayload: Record<string, unknown>;
  retried: boolean;
  createdAt: string;
}

/** Real-time in-app push payload emitted by the Socket.IO gateway. */
export interface InAppPayload {
  id: string;
  body: string;
  correlationId: string;
  createdAt: string;
}
