'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const initialState = { success: false, message: '' };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📬</div>
        <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
        <p className="text-sm text-gray-500">{state.message}</p>
        <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to login</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Forgot password?</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send a reset link.</p>

      {state.message && (
        <div className="mb-4">
          <Alert type="error" message={state.message} />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Button type="submit" loading={pending} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to login
        </Link>
      </p>
    </div>
  );
}
