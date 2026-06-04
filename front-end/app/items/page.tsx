'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/components/UserProvider';

interface Item {
  id: number;
  name: string;
  price: string;
}

const ITEMS: Item[] = [
  { id: 1, name: 'Mechanical Keyboard', price: '$129' },
  { id: 2, name: 'Wireless Mouse', price: '$59' },
  { id: 3, name: '4K Monitor', price: '$399' },
  { id: 4, name: 'USB-C Hub', price: '$45' },
  { id: 5, name: 'Noise-Cancelling Headphones', price: '$249' },
  { id: 6, name: 'Laptop Stand', price: '$39' },
];

export default function ItemsPage() {
  const { currentUser } = useUser();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirm = async () => {
    if (!currentUser || selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const variables = { orderId, itemCount: selected.size };

    try {
      // 1. Confirmation email to the acting user.
      await api.send({
        userId: currentUser.id,
        channel: 'EMAIL',
        templateName: 'order_confirmed',
        variables,
      });
      // 2. In-app push to all admins.
      await api.batch({
        toAdmins: true,
        channel: 'IN_APP',
        templateName: 'admin_bulk_action',
        variables: { ...variables, firstName: currentUser.name.split(' ')[0] },
      });

      setMessage({
        kind: 'ok',
        text: `Order ${orderId} confirmed — email queued to ${currentUser.email}, admins notified.`,
      });
      setSelected(new Set());
    } catch (e) {
      setMessage({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Items</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select items and confirm — a confirmation email is sent to you and an
          in-app push goes to all admins.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => {
          const isSel = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                isSel
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-sm text-slate-500">{item.price}</p>
              </div>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  isSel ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                }`}
              >
                {isSel && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={confirm}
          disabled={busy || selected.size === 0 || !currentUser}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Confirming…' : `Confirm ${selected.size > 0 ? `(${selected.size})` : ''}`}
        </button>
        {message && (
          <p className={`text-sm ${message.kind === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
