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
import { DateTimeCell } from '@/lib/guidanceCells';
import { toTitleCaseName } from '@/lib/text';
import { approveSupervisor2Request, rejectSupervisor2Request } from '@/services/lecturerGuidance.service';
import type { Supervisor2InboxItem } from '@/types/thesis-proposal.types';

/** The body of "Detail Permintaan Pembimbing 2" in Permohonan. */
export function Supervisor2InboxDetails({ item }: { item: Supervisor2InboxItem }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-muted-foreground">Mahasiswa</dt>
      <dd className="[overflow-wrap:anywhere]">{toTitleCaseName(item.studentName)}</dd>
      <dt className="text-muted-foreground">NIM</dt>
      <dd>{item.studentNim || '-'}</dd>
      <dt className="text-muted-foreground">Email</dt>
      <dd className="[overflow-wrap:anywhere]">{item.studentEmail || '-'}</dd>
      <dt className="text-muted-foreground">Judul</dt>
      <dd className="[overflow-wrap:anywhere]">{item.thesisTitle || '-'}</dd>
      <dt className="text-muted-foreground">Tanggal masuk</dt>
      <dd><DateTimeCell date={item.requestedAt} /></dd>
    </dl>
  );
}

export type Supervisor2LecturerDecision = { mode: 'approve' | 'reject'; item: Supervisor2InboxItem } | null;

/**
 * Bersedia or Tolak a Pembimbing 2 request (the old section of Permohonan, now one Jenis of the
 * table). Bersedia forwards it to the Ketua Departemen, who decides.
 */
export function Supervisor2LecturerDecisionDialog({ decision, onClose, onDone }: {
  decision: Supervisor2LecturerDecision;
  onClose: () => void;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const finish = () => {
    setReason('');
    queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    queryClient.invalidateQueries({ queryKey: ['supervisor2-requests'] });
    queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
    onClose();
    onDone?.();
  };
  const approve = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2Request(requestId),
    onSuccess: (data) => { toast.success(data.message || 'Permintaan diteruskan ke Ketua Departemen'); finish(); },
    onError: (error: Error) => toast.error('Gagal menyetujui permintaan', { description: error.message }),
  });
  const reject = useMutation({
    mutationFn: ({ requestId, reason: text }: { requestId: string; reason?: string }) => rejectSupervisor2Request(requestId, text),
    onSuccess: (data) => { toast.success(data.message || 'Permintaan ditolak'); finish(); },
    onError: (error: Error) => toast.error('Gagal menolak permintaan', { description: error.message }),
  });
  const isPending = approve.isPending || reject.isPending;
  const name = decision ? toTitleCaseName(decision.item.studentName) : '';

  return (
    <AlertDialog open={!!decision} onOpenChange={(open) => { if (!open) { setReason(''); onClose(); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision?.mode === 'approve' ? 'Bersedia menjadi Pembimbing 2?' : 'Tolak Permintaan Pembimbing 2?'}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {decision?.mode === 'approve' ? (
                <p>Permintaan <span className="font-medium text-foreground">{name}</span> diteruskan ke Ketua Departemen untuk ditetapkan.</p>
              ) : (
                <>
                  <p>Anda menolak permintaan dari <span className="font-medium text-foreground">{name}</span>.</p>
                  <div>
                    <label htmlFor="supervisor2-lecturer-reason" className="text-sm font-medium text-foreground">Alasan penolakan (opsional)</label>
                    <Textarea id="supervisor2-lecturer-reason" className="mt-1.5" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                </>
              )}
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
              if (decision.mode === 'approve') approve.mutate(decision.item.requestId);
              else reject.mutate({ requestId: decision.item.requestId, reason: reason.trim() || undefined });
            }}
          >
            {isPending ? <><Spinner className="mr-2 h-4 w-4" />Memproses...</> : decision?.mode === 'approve' ? 'Ya, Bersedia' : 'Ya, Tolak'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
