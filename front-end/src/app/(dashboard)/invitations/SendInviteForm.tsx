'use client';

import { useActionState } from 'react';
import { sendInvitationAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import type { Role } from '@/types';

const init = { success: false, message: '' };

export function SendInviteForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState(sendInvitationAction, init);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Send Invitation</h3>

      {state.message && (
        <div className="mb-4">
          <Alert type={state.success ? 'success' : 'error'} message={state.message} />
        </div>
      )}

      <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <Input label="Email address" name="email" type="email" required placeholder="colleague@example.com" />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            name="roleId"
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={pending}>
          Send invite
        </Button>
      </form>
    </div>
  );
}
