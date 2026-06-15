'use client';

import { useTransition } from 'react';
import { revokeInvitationAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export function RevokeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRevoke() {
    startTransition(async () => {
      await revokeInvitationAction(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
    >
      {pending ? 'Revoking…' : 'Revoke'}
    </button>
  );
}
