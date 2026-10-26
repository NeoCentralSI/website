import type { ReactNode } from 'react';
import { Eye, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateShortId } from '@/lib/text';
import { cn } from '@/lib/utils';

export type RequirementDocumentStatus = 'submitted' | 'approved' | 'declined' | null | undefined;

const STATUS: Record<'approved' | 'declined' | 'submitted', { label: string; badge: 'success' | 'destructive' | 'warning'; icon: string }> = {
  approved: { label: 'Disetujui', badge: 'success', icon: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
  declined: { label: 'Ditolak', badge: 'destructive', icon: 'border-red-200 bg-red-50 text-red-600' },
  submitted: { label: 'Menunggu', badge: 'warning', icon: 'border-blue-200 bg-blue-50 text-blue-600' },
};

interface RequirementDocumentRowProps {
  name: string;
  status: RequirementDocumentStatus;
  fileName?: string | null;
  submittedAt?: string | null;
  /** The rejection note. */
  notes?: string | null;
  /** Opens the full-screen viewer; no button when nothing is uploaded. */
  onView?: () => void;
  /** Extra actions after "Lihat" (e.g. the Admin's verification). */
  actions?: ReactNode;
}

/**
 * One requirement document in a detail page (Seminar Hasil, Sidang, Yudisium): status-coloured
 * icon, name, file and upload date, the status badge and "Lihat". No accent border or background.
 */
export function RequirementDocumentRow({ name, status, fileName, submittedAt, notes, onView, actions }: RequirementDocumentRowProps) {
  const state = status ? STATUS[status] : null;
  const fileLabel = fileName || (status ? 'File' : 'Belum diunggah');
  const date = submittedAt ? formatDateShortId(submittedAt) : '';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('shrink-0 rounded-lg border p-2.5', state?.icon ?? 'border-gray-200 bg-gray-50 text-gray-400')}>
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground" title={name}>{name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={fileLabel}>
            {fileLabel} {date && `• ${date}`}
          </span>
          {status === 'declined' && notes && (
            <span className="mt-1 block line-clamp-2 text-xs text-red-600" title={notes}>Catatan: {notes}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {state && (
          <Badge variant={state.badge} className="whitespace-nowrap rounded-md px-2.5 py-0.5 font-medium">{state.label}</Badge>
        )}
        {onView && (
          <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 border-gray-200 text-xs" onClick={onView}>
            <Eye className="h-3.5 w-3.5" />
            Lihat
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
