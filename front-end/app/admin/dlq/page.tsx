'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DeadLetterRecord } from '@/types/notification.types';

export default function DlqPage() {
  const [records, setRecords] = useState<DeadLetterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [inspect, setInspect] = useState<DeadLetterRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await api.dlqList());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id: string) => {
    setRetrying(id);
    try {
      await api.dlqRetry(id);
      await load();
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dead Letter Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jobs that exhausted all retries. Inspect the payload and re-enqueue.
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
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  DLQ is empty 🎉
                </td>
              </tr>
            )}
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50">
                <td className="max-w-xs truncate px-4 py-3 text-slate-700">{rec.reason}</td>
                <td className="px-4 py-3 text-slate-600">
                  {String((rec.rawPayload as any)?.channel ?? '—')}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(rec.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {rec.retried ? (
                    <span className="text-xs font-medium text-emerald-600">Retried</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setInspect(rec)}
                    className="mr-2 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => retry(rec.id)}
                    disabled={retrying === rec.id}
                    className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                  >
                    {retrying === rec.id ? 'Retrying…' : 'Retry'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inspect && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setInspect(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">DLQ Payload</h2>
              <button onClick={() => setInspect(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <p className="mb-3 text-sm text-rose-600">{inspect.reason}</p>
            <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(inspect.rawPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
