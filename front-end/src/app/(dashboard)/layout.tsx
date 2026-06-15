import Link from 'next/link';
import { logoutAction } from '@/lib/actions';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/members', label: 'Members', icon: '👥' },
  { href: '/invitations', label: 'Invitations', icon: '✉️' },
  { href: '/roles', label: 'Roles', icon: '🛡️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-lg font-bold text-indigo-600">SaaS Auth</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span>🚪</span>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
