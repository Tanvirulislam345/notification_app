'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const initialState = { success: false, message: '' };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  if (state.success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold text-gray-900">Check your inbox</h2>
        <p className="text-sm text-gray-500">{state.message}</p>
        <Link href="/login" className="inline-block text-sm text-indigo-600 hover:text-indigo-500">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-6">Start your free organization</p>

      {state.message && (
        <div className="mb-4">
          <Alert type="error" message={state.message} />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Input label="Your name" name="name" type="text" autoComplete="name" required />
        <Input label="Work email" name="email" type="email" autoComplete="email" required />
        <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Input label="Organization name" name="organizationName" type="text" required />

        <Button type="submit" loading={pending} className="w-full mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
