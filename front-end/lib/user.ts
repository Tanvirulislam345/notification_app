/**
 * Dev auth stub. The "current user" is persisted in localStorage and chosen via
 * the user switcher in the nav. Replace with Clerk session resolution later.
 */
const KEY = 'notif.currentUserId';

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setCurrentUserId(id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, id);
}
