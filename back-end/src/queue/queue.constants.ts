import { Channel } from '../common/enums';

/** BullMQ queue names, one per channel. */
export const EMAIL_QUEUE = 'email.queue';
export const INAPP_QUEUE = 'inapp.queue';

/** Map a delivery channel to its queue name. */
export function queueForChannel(channel: Channel): string {
  switch (channel) {
    case Channel.EMAIL:
      return EMAIL_QUEUE;
    case Channel.IN_APP:
      return INAPP_QUEUE;
    default:
      throw new Error(`No queue configured for channel ${channel}`);
  }
}

/**
 * Retry backoff schedule (ms) per the spec: 30s → 2m → 10m → 30m → DLQ.
 * attempts = schedule.length + 1 (the first attempt has no preceding delay).
 */
export const BACKOFF_SCHEDULE_MS = [30_000, 120_000, 600_000, 1_800_000];
export const MAX_ATTEMPTS = BACKOFF_SCHEDULE_MS.length + 1; // 5
export const BACKOFF_STRATEGY = 'notif-exponential';

/** Shape of the job payload carried through the queue. */
export interface NotificationJob {
  logId: string;
  userId: string;
  channel: Channel;
  correlationId: string;
  /** Resolved recipient + content (subject/body already interpolated). */
  recipient: string;
  subject?: string;
  body: string;
  /** Original template name + variables, retained for tracing / DLQ retry. */
  templateName?: string;
  variables?: Record<string, unknown>;
  /** Marks the recipient as an admin (joins the admin socket room). */
  isAdmin?: boolean;
}
