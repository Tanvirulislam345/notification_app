import { getRoles } from '@/lib/actions';
import { redirect } from 'next/navigation';

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-50 text-purple-700',
  ADMIN: 'bg-blue-50 text-blue-700',
  MANAGER: 'bg-indigo-50 text-indigo-700',
  USER: 'bg-gray-100 text-gray-700',
  VIEWER: 'bg-gray-50 text-gray-500',
};

const roleDescriptions: Record<string, string> = {
  OWNER: 'Full control — manages org, roles, and all members',
  ADMIN: 'Can invite and manage users, read roles and org info',
  MANAGER: 'Can read users and manage invitations',
  USER: 'Standard member with read access',
  VIEWER: 'Read-only access to org and users',
};

export default async function RolesPage() {
  let roles;
  try {
    roles = await getRoles();
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Roles</h2>
      <p className="text-sm text-gray-500 mb-8">System roles available in your organization</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${roleColors[role.name] ?? 'bg-gray-100 text-gray-600'}`}>
                {role.name}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {roleDescriptions[role.name] ?? 'Organization role'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
