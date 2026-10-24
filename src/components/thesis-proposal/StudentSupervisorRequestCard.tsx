import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SoftWarning } from '@/components/shared/SoftWarning';
import { useWithdrawSupervisorRequest } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { formatDateTimeWib } from '@/lib/text';
import type { StudentProposalOverview, StudentSupervisorRequests } from '@/types/thesis-proposal.types';
import { getRequestCardView, type RequestCardRow } from './studentProposalState';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

export const SUPERVISOR_REQUEST_FORM_PATH = '/tugas-akhir/proposal/pengajuan';

/** One label and value of the card, laid out like the seminar identity card. */
function InfoRow({ row }: { row: RequestCardRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="text-xs font-medium text-muted-foreground">{row.label}</div>
      <div className="truncate text-sm font-medium text-foreground" title={row.value}>{row.value}</div>
      {row.hint && <div className="text-xs text-muted-foreground">{row.hint}</div>}
    </div>
  );
}

/**
 * The card "Pengajuan Pembimbing": label and value rows per state (the grid of the seminar
 * identity card), the Ketua Departemen's note in the soft yellow box, and the actions (Ajukan
 * Pembimbing, Lanjutkan Draf, Revisi Pengajuan, Lihat Detail, Tarik or Batalkan Pengajuan). The
 * form is its own page; a student who may not submit reads why here.
 */
export function StudentSupervisorRequestCard({ data, overview }: { data: StudentSupervisorRequests; overview?: StudentProposalOverview }) {
  const navigate = useNavigate();
  const withdraw = useWithdrawSupervisorRequest();
  const [confirm, setConfirm] = useState(false);
  const [detail, setDetail] = useState(false);
  const view = getRequestCardView(data, overview);
  const request = view.request;
  const cancelling = view.buttons.includes('cancel');
  const actionLabel = cancelling ? 'Batalkan Pengajuan' : 'Tarik Pengajuan';

  return (
    <section aria-label="Kartu Pengajuan Pembimbing" className="flex flex-1 flex-col gap-3 rounded-[10px] border border-gray-200 bg-card p-[16px_18px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-semibold text-foreground">Pengajuan Pembimbing</div>
        <Badge variant={view.variant}>{view.status}</Badge>
      </div>
      {view.message && <p className="text-sm text-muted-foreground">{view.message}</p>}
      {view.rows.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Isi pengajuan pembimbing">
          {view.rows.map((row) => <InfoRow key={row.label} row={row} />)}
        </div>
      )}
      {view.kadepNote && <SoftWarning title="Catatan Ketua Departemen">{view.kadepNote}</SoftWarning>}

      {view.buttons.length > 0 && (
        <div className="mt-auto flex flex-wrap justify-end gap-2">
          {view.buttons.includes('detail') && request && (
            <Button size="sm" variant="outline" onClick={() => setDetail(true)}>Lihat Detail</Button>
          )}
          {(view.buttons.includes('withdraw') || cancelling) && (
            <span title={view.blockReason ?? undefined} className="inline-flex">
              <Button size="sm" variant="outline" disabled={Boolean(view.blockReason) || withdraw.isPending} onClick={() => setConfirm(true)}>
                {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{cancelling ? actionLabel : 'Tarik'}
              </Button>
            </span>
          )}
          {view.buttons.includes('submit') && <Button size="sm" onClick={() => navigate(SUPERVISOR_REQUEST_FORM_PATH)}>Ajukan Pembimbing</Button>}
          {view.buttons.includes('continue') && <Button size="sm" onClick={() => navigate(SUPERVISOR_REQUEST_FORM_PATH)}>Lanjutkan Draf</Button>}
          {view.buttons.includes('revise') && <Button size="sm" onClick={() => navigate(SUPERVISOR_REQUEST_FORM_PATH)}>Revisi Pengajuan</Button>}
        </div>
      )}

      {request && (
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                {cancelling
                  ? 'Persetujuan dosen dibatalkan dan relasi pembimbing dilepas. Draf Anda tetap tersimpan untuk pengajuan baru.'
                  : 'Pengajuan ditarik dari dosen atau Ketua Departemen. Draf Anda tetap tersimpan untuk pengajuan baru.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => withdraw.mutate(request.id)}>{actionLabel}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {request && (
        <RecordDetailDialog
          open={detail}
          onOpenChange={setDetail}
          title="Detail Pengajuan Pembimbing"
          description={`Dikirim ${formatDateTimeWib(request.createdAt)}`}
          footer={<DetailDialogActions onClose={() => setDetail(false)} />}
        >
          <SupervisorRequestDetails request={request} />
        </RecordDetailDialog>
      )}
    </section>
  );
}
