import { useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { SectionHeading } from '@/components/shared/PageHeading';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useMySupervisorRequests, useWithdrawSupervisorRequest } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import {
  getSupervisorRequestRouteLabel,
  getSupervisorRequestStatusLabel,
  getSupervisorRequestStatusVariant,
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS,
} from '@/lib/thesisLabels';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';
import { StudentSupervisorRequestForm } from './StudentSupervisorRequestForm';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

const WAITING = ['pending', 'under_review', 'pending_kadep'];
const ACCEPTED = ['accepted', 'redirected'];

/** Why the student cannot pull back or cancel the active request now (null = allowed). */
export function getWithdrawBlockReason(request: SupervisorRequest, now = new Date()): string | null {
  if (WAITING.includes(request.status)) {
    if (request.withdrawAvailableAt && new Date(request.withdrawAvailableAt) > now) {
      return `Pengajuan bisa ditarik mulai ${formatDateTimeWib(request.withdrawAvailableAt)} (72 jam setelah dikirim).`;
    }
    return null;
  }
  if (ACCEPTED.includes(request.status)) {
    if (request.thesis?.supervisorAssignedAt) return 'Pembimbing sudah ditetapkan; pergantian lewat Pengajuan Perubahan Tugas Akhir.';
    return null;
  }
  return 'Pembimbing sudah ditetapkan; pergantian lewat Pengajuan Perubahan Tugas Akhir.';
}

function ActiveRequest({ request }: { request: SupervisorRequest }) {
  const withdraw = useWithdrawSupervisorRequest();
  const [confirm, setConfirm] = useState(false);
  const isAccepted = ACCEPTED.includes(request.status);
  const blockReason = getWithdrawBlockReason(request);
  const label = isAccepted ? 'Batalkan Pengajuan' : 'Tarik Pengajuan';

  return (
    <>
      <SupervisorRequestDetails
        request={request}
        actions={
          request.status !== 'assigned' && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
              {blockReason && <p className="mr-auto text-xs text-muted-foreground">{blockReason}</p>}
              <span title={blockReason ?? undefined}>
                <Button variant="outline" size="sm" disabled={Boolean(blockReason) || withdraw.isPending} onClick={() => setConfirm(true)}>
                  {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{label}
                </Button>
              </span>
            </div>
          )
        }
      />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAccepted
                ? 'Persetujuan dosen dibatalkan dan relasi pembimbing dilepas. Draf Anda tetap tersimpan untuk pengajuan baru.'
                : 'Pengajuan ditarik dari dosen atau Ketua Departemen. Draf Anda tetap tersimpan untuk pengajuan baru.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => withdraw.mutate(request.id)}>{label}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Paket P8 (1.2): the student's earlier requests as a table below the card, detail in a modal. */
function SupervisorRequestHistoryTable({ history }: { history: SupervisorRequest[] }) {
  const [detail, setDetail] = useState<SupervisorRequest | null>(null);
  const table = useLocalTable(history, (r, term) => haystack(r.proposedTitle, r.supervisor?.fullName, r.lecturer?.fullName).includes(term), 5);
  const columns: Column<SupervisorRequest>[] = [
    { key: 'createdAt', header: 'Dikirim', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (r) => <DateTimeCell date={r.createdAt} /> },
    { key: 'title', header: 'Judul', className: CLIP_CELL, render: (r) => <TruncatedText text={r.proposedTitle} className="max-w-full" /> },
    {
      key: 'lecturer',
      header: 'Dosen dan Jalur',
      width: 220,
      className: CLIP_CELL,
      render: (r) => {
        const name = r.supervisor?.fullName ?? r.lecturer?.fullName;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm">{name ? formatLecturerName(name) : 'Ditetapkan departemen'}</p>
            <p className="truncate text-xs text-muted-foreground">{getSupervisorRequestRouteLabel(r.route)}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.supervisorRequestShortStatus,
      className: CLIP_CELL,
      render: (r) => (
        <Badge variant={getSupervisorRequestStatusVariant(r.status)} className="whitespace-nowrap" title={getSupervisorRequestStatusLabel(r.status)}>
          {SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (r) => <div className="flex justify-center"><TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(r)} /></div>,
    },
  ];
  return (
    <div className="space-y-3">
      <SectionHeading title="Riwayat Pengajuan Pembimbing" description="Pengajuan sebelumnya yang sudah ditutup, ditolak, ditarik, atau dibatalkan" />
      <CustomTable columns={columns} {...table.tableProps} tableClassName="table-fixed" emptyText="Tidak ditemukan" rowKey={(r) => r.id} searchPlaceholder="Cari judul atau dosen..." />
      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Pengajuan Pembimbing"
        description={detail ? `Dikirim ${formatDateTimeWib(detail.createdAt)}` : undefined}
        footer={detail ? <DetailDialogActions onClose={() => setDetail(null)} /> : undefined}
      >
        {detail && <SupervisorRequestDetails request={detail} />}
      </RecordDetailDialog>
    </div>
  );
}

/** Bagian 1 halaman Proposal: Pengajuan Pembimbing (bisa dibuka sebelum TA ada, K14). */
export function StudentSupervisorRequestSection() {
  const { data, isLoading, error } = useMySupervisorRequests();

  if (isLoading) return <Card><CardContent className="flex justify-center py-10"><Spinner className="h-6 w-6" /></CardContent></Card>;
  if (error || !data) {
    return <Card><CardContent className="py-6 text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat pengajuan pembimbing.'}</CardContent></Card>;
  }

  const { submission, activeRequest, requests, draft } = data;
  const history = requests.filter((request) => request.id !== activeRequest?.id);
  const lastClosed = history[0] ?? null;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengajuan Pembimbing</CardTitle>
        <CardDescription>
          Semester {submission.academicYear?.label ?? '-'} · Mengambil Metode Penelitian menurut SIA:{' '}
          {submission.eligibleResearchMethod === true ? 'Ya' : submission.eligibleResearchMethod === false ? 'Tidak' : 'Belum ada data'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeRequest ? (
          <ActiveRequest request={activeRequest} />
        ) : submission.canSubmit ? (
          <>
            {lastClosed && ['rejected_by_lecturer', 'rejected_by_kadep', 'closed', 'revision_requested'].includes(lastClosed.status) && (
              <Alert>
                <AlertDescription>
                  {submission.revisionRequested
                    ? 'Ketua Departemen meminta revisi. Perbarui isian di bawah sesuai catatan lalu ajukan ulang.'
                    : 'Pengajuan sebelumnya tidak disetujui. Isian Anda tersimpan; pilih dosen lain atau ajukan lewat departemen.'}
                </AlertDescription>
              </Alert>
            )}
            <StudentSupervisorRequestForm draft={draft} />
          </>
        ) : (
          <Alert>
            <AlertDescription>{submission.blockedReason}</AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
    {history.length > 0 && <SupervisorRequestHistoryTable history={history} />}
    </>
  );
}
