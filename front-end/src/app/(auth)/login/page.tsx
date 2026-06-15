'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const initialState = { success: false, message: '' };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

      {state.message && !state.success && (
        <div className="mb-4">
          <Alert type="error" message={state.message} />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={pending} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create one
        </Link>
      </p>
    </div>
  );
}
