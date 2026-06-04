'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useUser } from './UserProvider';
import type { InAppPayload } from '@/types/notification.types';

/**
 * Persistent nav bell. Subscribes to the Socket.IO gateway for the current user
 * (and the admin room when applicable) and shows live in-app notifications.
 */
export function NotificationBell() {
  const { currentUser } = useUser();
  const [items, setItems] = useState<InAppPayload[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket(currentUser.id, currentUser.isAdmin);

    const onNotification = (payload: InAppPayload) =>
      setItems((prev) => [payload, ...prev].slice(0, 30));
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('notification', onNotification);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off('notification', onNotification);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [currentUser]);

  // Close dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.8 23.8 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.97 8.97 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a24.2 24.2 0 0 1-6.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {unread}
          </span>
        )}
        <span
          className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-300'}`}
          title={connected ? 'Live' : 'Disconnected'}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => setItems([])}
                className="text-xs text-brand-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No new notifications
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id + n.createdAt} className="border-b border-slate-50 px-4 py-3 last:border-0">
                  <p className="text-sm text-slate-700">{n.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
