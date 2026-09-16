import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loading } from '@/components/ui/spinner';
import { useLecturerQuotaDetail } from '@/hooks/master-data/useSupervisionQuota';
import type {
  LecturerQuotaDetail,
  LecturerQuotaEntry,
} from '@/services/supervisionQuota.service';
import { getAdvisorRequestStatus } from '@/lib/metopen/statusBadge';
import { cn } from '@/lib/utils';
import { formatDateId, formatRoleName, toTitleCaseName } from '@/lib/text';

export type QuotaMetricKey = 'active' | 'booking' | 'pendingKadep' | 'overquotaSah';

export interface QuotaDetailSelection {
  lecturerId: string;
  lecturerName: string;
  metric: QuotaMetricKey;
}

interface QuotaMetricButtonProps {
  label: string;
  lecturerName: string;
  value: number;
  tone?: 'default' | 'danger';
  onClick: () => void;
}

export function QuotaMetricButton({
  label,
  lecturerName,
  value,
  tone = 'default',
  onClick,
}: QuotaMetricButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Lihat ${label} ${toTitleCaseName(lecturerName)}`}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-8 min-w-8 items-center justify-center rounded-md px-2 font-semibold tabular-nums',
        'transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        tone === 'danger' && value > 0 && 'text-destructive',
      )}
    >
      {value}
    </button>
  );
}

const METRIC_CONFIG: Record<
  QuotaMetricKey,
  {
    title: string;
    description: string;
    selectEntries: (detail: LecturerQuotaDetail) => LecturerQuotaEntry[];
  }
> = {
  active: {
    title: 'Beban Aktif',
    description: 'Mahasiswa Tugas Akhir yang sudah menjadi beban aktif dosen.',
    selectEntries: (detail) => detail.activeOfficialEntries,
  },
  booking: {
    title: 'Booking',
    description: 'Mahasiswa fase Metopel yang sudah mereservasi slot pembimbing.',
    selectEntries: (detail) => detail.bookingEntries,
  },
  pendingKadep: {
    title: 'Pending KaDep',
    description: 'Pengajuan yang masih menunggu keputusan departemen.',
    selectEntries: (detail) => detail.pendingKadepEntries,
  },
  overquotaSah: {
    title: 'Overquota Sah',
    description: 'Booking atau beban aktif dengan persetujuan eksplisit di atas kuota normal.',
    selectEntries: (detail) => detail.overquotaSahEntries,
  },
};

interface LecturerQuotaDetailDialogProps {
  selection: QuotaDetailSelection | null;
  academicYearId: string | undefined;
  academicYearLabel?: string;
  onOpenChange: (open: boolean) => void;
}

export function LecturerQuotaDetailDialog({
  selection,
  academicYearId,
  academicYearLabel,
  onOpenChange,
}: LecturerQuotaDetailDialogProps) {
  const detailQuery = useLecturerQuotaDetail(
    selection?.lecturerId,
    academicYearId,
    Boolean(selection),
  );
  const metric = selection ? METRIC_CONFIG[selection.metric] : null;
  const entries = useMemo(
    () => (detailQuery.data && metric ? metric.selectEntries(detailQuery.data) : []),
    [detailQuery.data, metric],
  );

  return (
    <Dialog open={Boolean(selection)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {metric?.title ?? 'Rincian Kuota'} —{' '}
            {selection ? toTitleCaseName(selection.lecturerName) : '-'}
          </DialogTitle>
          <DialogDescription>
            {metric?.description}{' '}
            {academicYearLabel ? `Snapshot periode ${academicYearLabel}.` : null}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <Loading size="sm" text="Memuat rincian kuota..." className="py-8" />
        ) : detailQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Rincian tidak dapat dimuat</AlertTitle>
            <AlertDescription>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Terjadi kesalahan saat mengambil snapshot kuota.'}
            </AlertDescription>
          </Alert>
        ) : entries.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-10 text-center">
            <p className="text-sm font-medium">Tidak ada mahasiswa pada kategori ini</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nilai 0 tetap dapat dibuka untuk memastikan snapshot dan kategori yang dipakai.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {entries.length} mahasiswa dari snapshot computed yang sama dengan tabel.
            </p>
            {entries.map((entry) => {
              const status = getAdvisorRequestStatus(entry.requestStatus, 'staff');
              return (
                <div key={entry.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{toTitleCaseName(entry.studentName)}</p>
                      <p className="text-xs text-muted-foreground">
                        NIM {entry.studentIdentityNumber || '-'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.requestStatus ? (
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      ) : null}
                      {entry.acceptedOverNormal ? (
                        <Badge variant="destructive">Overquota sah</Badge>
                      ) : null}
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Judul</dt>
                      <dd className="mt-0.5 text-foreground">{entry.thesisTitle || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Peran kuota</dt>
                      <dd className="mt-0.5 text-foreground">
                        {formatRoleName(entry.roleName)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Sumber pencatatan</dt>
                      <dd className="mt-0.5 text-foreground">
                        {entry.source === 'request' ? 'Pengajuan pembimbing' : 'Relasi pembimbing'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tercatat</dt>
                      <dd className="mt-0.5 text-foreground">{formatDateId(entry.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
