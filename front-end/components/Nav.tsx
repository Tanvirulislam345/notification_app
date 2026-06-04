'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from './UserProvider';
import { NotificationBell } from './NotificationBell';

const LINKS = [
  { href: '/items', label: 'Items' },
  { href: '/notifications', label: 'History' },
  { href: '/preferences', label: 'Preferences' },
  { href: '/admin/dlq', label: 'DLQ Admin' },
];

export function Nav() {
  const pathname = usePathname();
  const { users, currentUser, setCurrentUser } = useUser();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/items" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="text-xl">🔔</span> Notifier
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentUser?.id ?? ''}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
            title="Acting as (dev auth stub)"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.isAdmin ? ' (admin)' : ''}
              </option>
            ))}
          </select>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
