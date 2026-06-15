import { getMembers } from '@/lib/actions';
import { redirect } from 'next/navigation';

export default async function MembersPage() {
  let members;
  try {
    members = await getMembers();
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Members</h2>
      <p className="text-sm text-gray-500 mb-8">Everyone in your organization</p>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No members yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
