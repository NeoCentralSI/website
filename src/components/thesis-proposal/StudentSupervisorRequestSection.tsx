import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';
import { useMySupervisorRequests, useWithdrawSupervisorRequest } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { formatDateTimeWib } from '@/lib/text';
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
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => withdraw.mutate(request.id)}>{label}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Bagian 1 halaman Proposal: Pengajuan Pembimbing (bisa dibuka sebelum TA ada, K14). */
export function StudentSupervisorRequestSection() {
  const { data, isLoading, error } = useMySupervisorRequests();
  const [historyOpen, setHistoryOpen] = useState(false);

  if (isLoading) return <Card><CardContent className="flex justify-center py-10"><Spinner className="h-6 w-6" /></CardContent></Card>;
  if (error || !data) {
    return <Card><CardContent className="py-6 text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat pengajuan pembimbing.'}</CardContent></Card>;
  }

  const { submission, activeRequest, requests, draft } = data;
  const history = requests.filter((request) => request.id !== activeRequest?.id);
  const lastClosed = history[0] ?? null;

  return (
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

        {history.length > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="border-t pt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">{historyOpen ? 'Sembunyikan' : 'Tampilkan'} riwayat pengajuan ({history.length})</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {history.map((request) => (
                <div key={request.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <SupervisorRequestStatusBadge status={request.status} />
                    <span>{formatDateTimeWib(request.createdAt)}</span>
                  </div>
                  <SupervisorRequestDetails request={request} showContent={false} />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
