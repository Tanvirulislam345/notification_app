import { getInvitations, getRoles } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { SendInviteForm } from './SendInviteForm';
import { RevokeButton } from './RevokeButton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-green-50 text-green-700',
  revoked: 'bg-gray-100 text-gray-500',
  expired: 'bg-red-50 text-red-600',
};

export default async function InvitationsPage() {
  let invitations, roles;
  try {
    [invitations, roles] = await Promise.all([getInvitations(), getRoles()]);
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Invitations</h2>
      <p className="text-sm text-gray-500 mb-8">Invite people to join your organization</p>

      <SendInviteForm roles={roles} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Sent Invitations</h3>
        </div>
        {invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No invitations sent yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Email', 'Status', 'Expires', ''].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{inv.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {inv.status === 'pending' && <RevokeButton id={inv.id} />}
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
