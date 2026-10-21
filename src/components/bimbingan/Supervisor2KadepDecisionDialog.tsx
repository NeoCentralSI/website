import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatLecturerName, toTitleCaseName } from '@/lib/text';
import { approveSupervisor2KadepRequest, rejectSupervisor2KadepRequest } from '@/services/lecturerGuidance.service';

export const SUPERVISOR2_CLOSED_INTAKE = 'Dosen sedang menutup penerimaan permintaan pembimbing.';
export const SUPERVISOR2_FULL_NOTE = 'Calon Pembimbing 2 sudah mencapai batas bimbingan. Persetujuan tetap dapat diberikan.';

export interface Supervisor2Decision {
  mode: 'approve' | 'reject';
  request: { requestId: string; studentName: string; lecturerName: string };
  /** The candidate is at the hard limit (a note only; the Head of Department decides). */
  quotaFull?: boolean;
}

/**
 * Keputusan Ketua Departemen atas permintaan Pembimbing 2 (dari tab lama "Permintaan Pembimbing
 * 2"; dipakai di tabel Penetapan). Setujui menetapkan Pembimbing 2; bila Penetapan
 * Pembimbing periode itu sudah terbit, Kadep menerbitkan versi barunya.
 */
export function Supervisor2KadepDecisionDialog({ decision, onClose, onDone }: {
  decision: Supervisor2Decision | null;
  onClose: () => void;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const finish = () => {
    setReason('');
    queryClient.invalidateQueries({ queryKey: ['kadep-supervisor2-requests'] });
    queryClient.invalidateQueries({ queryKey: ['supervision-quotas'] });
    queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    onClose();
    onDone?.();
  };
  const approve = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2KadepRequest(requestId),
    onSuccess: (data) => { toast.success(data.message || 'Pembimbing 2 disetujui.'); finish(); },
    onError: (error: Error) => toast.error('Gagal menyetujui', { description: error.message }),
  });
  const reject = useMutation({
    mutationFn: ({ requestId, reason: text }: { requestId: string; reason?: string }) => rejectSupervisor2KadepRequest(requestId, text),
    onSuccess: (data) => { toast.success(data.message || 'Permintaan tidak disetujui.'); finish(); },
    onError: (error: Error) => toast.error('Gagal menolak', { description: error.message }),
  });
  const isPending = approve.isPending || reject.isPending;

  return (
    <AlertDialog open={!!decision} onOpenChange={(open) => { if (!open) { setReason(''); onClose(); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision?.mode === 'approve' ? 'Setujui Pembimbing 2?' : 'Tolak Permintaan Pembimbing 2?'}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {decision?.mode === 'approve' ? (
                <p>
                  <span className="font-medium text-foreground">{formatLecturerName(decision.request.lecturerName)}</span> ditetapkan sebagai Pembimbing 2 untuk{' '}
                  <span className="font-medium text-foreground">{toTitleCaseName(decision.request.studentName)}</span>. Bila Penetapan Pembimbing periode itu sudah
                  terbit, terbitkan versi barunya agar memuat Pembimbing 2.
                  {decision.quotaFull ? ` ${SUPERVISOR2_FULL_NOTE}` : ''}
                </p>
              ) : decision ? (
                <>
                  <p>
                    Permintaan Pembimbing 2 dari <span className="font-medium text-foreground">{toTitleCaseName(decision.request.studentName)}</span> (dosen:{' '}
                    {formatLecturerName(decision.request.lecturerName)}) ditutup. Mahasiswa dan dosen mendapat notifikasi.
                  </p>
                  <div>
                    <label htmlFor="supervisor2-reject-reason" className="text-sm font-medium text-foreground">Alasan (opsional)</label>
                    <Textarea id="supervisor2-reject-reason" className="mt-1.5" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                </>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={decision?.mode === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (!decision) return;
              if (decision.mode === 'approve') approve.mutate(decision.request.requestId);
              else reject.mutate({ requestId: decision.request.requestId, reason: reason.trim() || undefined });
            }}
          >
            {isPending ? <><Spinner className="mr-2 h-4 w-4" />Memproses...</> : decision?.mode === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
