'use client';

import { useActionState, use } from 'react';
import Link from 'next/link';
import { acceptInvitationAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const initialState = { success: false, message: '' };

export default function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialState);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Invalid invitation</h2>
          <p className="text-sm text-gray-500">No invitation token found in the URL.</p>
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to login</Link>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900">You&apos;re in!</h2>
          <p className="text-sm text-gray-500">{state.message}</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">SaaS Auth</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Accept invitation</h2>
          <p className="text-sm text-gray-500 mb-6">Create your account to join the organization.</p>

          {state.message && (
            <div className="mb-4">
              <Alert type="error" message={state.message} />
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <Input label="Your name" name="name" type="text" autoComplete="name" required />
            <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            <Button type="submit" loading={pending} className="w-full">
              Join organization
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
