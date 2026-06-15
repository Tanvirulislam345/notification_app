import Link from 'next/link';

async function verifyEmail(token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/verify-email?token=${token}`,
      { cache: 'no-store' }
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? 'Verification failed');
    return { success: true, message: body.message as string };
  } catch (e: any) {
    return { success: false, message: e.message ?? 'Invalid or expired link' };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900">Invalid link</h2>
        <p className="text-sm text-gray-500">No verification token found in the URL.</p>
        <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to login</Link>
      </div>
    );
  }

  const result = await verifyEmail(token);

  return (
    <div className="text-center space-y-4">
      <div className="text-4xl">{result.success ? '✅' : '❌'}</div>
      <h2 className="text-xl font-semibold text-gray-900">
        {result.success ? 'Email verified!' : 'Verification failed'}
      </h2>
      <p className="text-sm text-gray-500">{result.message}</p>
      {result.success && (
        <Link
          href="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign in now
        </Link>
      )}
      {!result.success && (
        <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
          Back to login
        </Link>
      )}
    </div>
  );
}
