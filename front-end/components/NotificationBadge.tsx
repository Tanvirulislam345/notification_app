import type { NotificationStatus } from '@/types/notification.types';

const STYLES: Record<string, string> = {
  SENT: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 ring-amber-200',
  RETRYING: 'bg-amber-100 text-amber-700 ring-amber-200',
  FAILED: 'bg-rose-100 text-rose-700 ring-rose-200',
  DLQ: 'bg-slate-200 text-slate-700 ring-slate-300',
};

const LABELS: Record<string, string> = {
  SENT: 'Sent',
  PENDING: 'Pending',
  FAILED: 'Failed',
  DLQ: 'DLQ',
};

/**
 * Status pill. A PENDING log with >0 attempts is shown as "Retrying" to match
 * the spec's badge set (Sent / Failed / Retrying / DLQ).
 */
export function NotificationBadge({
  status,
  attempts,
}: {
  status: NotificationStatus;
  attempts?: number;
}) {
  const retrying = status === 'PENDING' && (attempts ?? 0) > 0;
  const key = retrying ? 'RETRYING' : status;
  const label = retrying ? 'Retrying' : LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[key]}`}
    >
      {label}
    </span>
  );
}
