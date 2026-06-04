import type {
  Channel,
  DeadLetterRecord,
  NotificationLog,
  User,
  UserPreference,
} from '@/types/notification.types';
import { getCurrentUserId } from './user';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Dev auth stub: identify the acting user.
      'x-user-id': getCurrentUserId() ?? '',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface SendPayload {
  userId: string;
  channel: Channel;
  templateName?: string;
  variables?: Record<string, unknown>;
  body?: string;
  subject?: string;
  sync?: boolean;
}

export interface BatchPayload {
  userIds?: string[];
  toAdmins?: boolean;
  channel: Channel;
  templateName?: string;
  variables?: Record<string, unknown>;
  body?: string;
  subject?: string;
}

export const api = {
  listUsers: () => request<User[]>('/users'),

  send: (payload: SendPayload) =>
    request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  batch: (payload: BatchPayload) =>
    request('/notifications/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  history: (userId: string) =>
    request<NotificationLog[]>(`/notifications/${userId}`),

  dlqList: () => request<DeadLetterRecord[]>('/notifications/dlq'),

  dlqRetry: (id: string) =>
    request(`/notifications/dlq/${id}/retry`, { method: 'POST' }),

  getPreferences: (userId: string) =>
    request<UserPreference[]>(`/preferences/${userId}`),

  updatePreferences: (
    userId: string,
    preferences: Array<Partial<UserPreference> & { channel: Channel; optedIn: boolean }>,
  ) =>
    request<UserPreference[]>(`/preferences/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),
};
