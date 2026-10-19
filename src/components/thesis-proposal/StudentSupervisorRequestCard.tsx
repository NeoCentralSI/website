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
import { useWithdrawSupervisorRequest } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { formatDateTimeWib } from '@/lib/text';
import type { StudentSupervisorRequests } from '@/types/thesis-proposal.types';
import { getRequestCardState, getWithdrawBlockReason } from './studentProposalState';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

export const SUPERVISOR_REQUEST_FORM_PATH = '/tugas-akhir/proposal/pengajuan';

/**
 * The right-hand card "Pengajuan Pembimbing": a short status and one action
 * (Ajukan Pembimbing, Lanjutkan Draf, Tarik Pengajuan, Batalkan Pengajuan or Lihat Detail). The
 * form is its own page; a student who may not submit reads why here.
 */
export function StudentSupervisorRequestCard({ data }: { data: StudentSupervisorRequests }) {
  const navigate = useNavigate();
  const withdraw = useWithdrawSupervisorRequest();
  const [confirm, setConfirm] = useState(false);
  const [detail, setDetail] = useState(false);
  const state = getRequestCardState(data);
  const request = state.request;
  const blockReason = request && (state.action === 'withdraw' || state.action === 'cancel') ? getWithdrawBlockReason(request) : null;
  const actionLabel = state.action === 'cancel' ? 'Batalkan Pengajuan' : 'Tarik Pengajuan';

  return (
    <div className="space-y-3 rounded-[10px] border border-gray-200 bg-card p-[16px_18px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base font-semibold text-foreground">Pengajuan Pembimbing</div>
        <Badge variant={state.variant}>{state.status}</Badge>
      </div>
      {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}

      {state.action && (
        <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
          {(state.action === 'submit' || state.action === 'continue') && (
            <Button size="sm" onClick={() => navigate(SUPERVISOR_REQUEST_FORM_PATH)}>
              {state.action === 'submit' ? 'Ajukan Pembimbing' : 'Lanjutkan Draf'}
            </Button>
          )}
          {(state.action === 'withdraw' || state.action === 'cancel') && (
            <span title={blockReason ?? undefined} className="inline-flex">
              <Button size="sm" variant="outline" disabled={Boolean(blockReason) || withdraw.isPending} onClick={() => setConfirm(true)}>
                {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{actionLabel}
              </Button>
            </span>
          )}
          {state.action === 'detail' && <Button size="sm" variant="outline" onClick={() => setDetail(true)}>Lihat Detail</Button>}
        </div>
      )}

      {request && (
        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                {state.action === 'cancel'
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
    </div>
  );
}
