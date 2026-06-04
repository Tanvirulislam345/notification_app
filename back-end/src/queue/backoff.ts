import { BACKOFF_SCHEDULE_MS } from './queue.constants';

/**
 * Custom BullMQ backoff producing the spec schedule: 30s → 2m → 10m → 30m.
 * `attemptsMade` is 1-based on the first retry, so index with `attemptsMade-1`.
 */
export function notifBackoff(attemptsMade: number): number {
  const idx = Math.max(0, attemptsMade - 1);
  return BACKOFF_SCHEDULE_MS[idx] ?? BACKOFF_SCHEDULE_MS[BACKOFF_SCHEDULE_MS.length - 1];
}
