'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/components/UserProvider';
import type { Channel, UserPreference } from '@/types/notification.types';

const CHANNELS: { channel: Channel; label: string; hint: string }[] = [
  { channel: 'EMAIL', label: 'Email', hint: 'Order confirmations & alerts via email' },
  { channel: 'IN_APP', label: 'In-App Push', hint: 'Real-time notifications in the bell' },
];

interface Row {
  channel: Channel;
  optedIn: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  priority: number;
}

function toRow(channel: Channel, pref?: UserPreference): Row {
  return {
    channel,
    optedIn: pref?.optedIn ?? true,
    quietHoursStart: pref?.quietHoursStart?.slice(0, 5) ?? '',
    quietHoursEnd: pref?.quietHoursEnd?.slice(0, 5) ?? '',
    priority: pref?.priority ?? 100,
  };
}

export default function PreferencesPage() {
  const { currentUser } = useUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) return;
    const prefs = await api.getPreferences(currentUser.id);
    setRows(
      CHANNELS.map((c) => toRow(c.channel, prefs.find((p) => p.channel === c.channel))),
    );
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = (channel: Channel, change: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.channel === channel ? { ...r, ...change } : r)));

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updatePreferences(
        currentUser.id,
        rows.map((r) => ({
          channel: r.channel,
          optedIn: r.optedIn,
          quietHoursStart: r.quietHoursStart || null,
          quietHoursEnd: r.quietHoursEnd || null,
          priority: r.priority,
        })),
      );
      setSaved(true);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Preferences</h1>
        <p className="mt-1 text-sm text-slate-500">
          Opt in/out per channel and set quiet hours (in your timezone:{' '}
          <span className="font-medium">{currentUser?.timezone}</span>). Quiet-hours
          notifications are delayed, not dropped.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const meta = CHANNELS.find((c) => c.channel === row.channel)!;
          return (
            <div key={row.channel} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">{meta.label}</h2>
                  <p className="text-sm text-slate-500">{meta.hint}</p>
                </div>
                <button
                  onClick={() => patch(row.channel, { optedIn: !row.optedIn })}
                  className={`relative h-6 w-11 rounded-full transition ${
                    row.optedIn ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                  aria-pressed={row.optedIn}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      row.optedIn ? 'left-[1.375rem]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Quiet hours start</span>
                  <input
                    type="time"
                    value={row.quietHoursStart}
                    onChange={(e) => patch(row.channel, { quietHoursStart: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Quiet hours end</span>
                  <input
                    type="time"
                    value={row.quietHoursEnd}
                    onChange={(e) => patch(row.channel, { quietHoursEnd: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving || !currentUser}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </div>
  );
}
