'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUser } from '@/components/UserProvider';
import type { NotificationLog } from '@/types/notification.types';

export default function NotificationsPage() {
  const { currentUser } = useUser();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      setLogs(await api.history(currentUser.id));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // poll for status transitions
    return () => clearInterval(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Delivery log for {currentUser?.name ?? '—'} (auto-refreshes).
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Subject / Body</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No notifications yet — confirm some items first.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {log.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="max-w-md truncate">
                    {log.payload?.subject ? (
                      <span className="font-medium">{log.payload.subject} · </span>
                    ) : null}
                    {log.payload?.body}
                  </div>
                  {log.errorMessage && (
                    <p className="mt-0.5 text-xs text-rose-500">{log.errorMessage}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <NotificationBadge status={log.status} attempts={log.attempts} />
                </td>
                <td className="px-4 py-3 text-slate-500">{log.attempts}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
