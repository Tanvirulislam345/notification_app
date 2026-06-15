'use client';

import { useActionState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { resetPasswordAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const initialState = { success: false, message: '' };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">🔐</div>
        <h2 className="text-xl font-semibold text-gray-900">Password reset!</h2>
        <p className="text-sm text-gray-500">{state.message}</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Reset your password</h2>
      <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

      {state.message && (
        <div className="mb-4">
          <Alert type="error" message={state.message} />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token ?? ''} />
        <Input label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
        <Input label="Confirm password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
        <Button type="submit" loading={pending} className="w-full">
          Reset password
        </Button>
      </form>
    </div>
  );
}
