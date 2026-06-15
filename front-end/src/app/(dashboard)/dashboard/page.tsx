import { getOrganization } from '@/lib/actions';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  let org;
  try {
    org = await getOrganization();
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-8">Your organization overview</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Organization</p>
          <p className="text-xl font-bold text-gray-900">{org.name}</p>
          <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {org.status}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Organization ID</p>
          <p className="text-sm font-mono text-gray-700 break-all">{org.id}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
          <p className="text-sm text-gray-700">
            {new Date(org.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
