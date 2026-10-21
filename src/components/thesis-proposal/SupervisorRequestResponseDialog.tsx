import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRespondSupervisorRequest } from '@/hooks/thesis-proposal/useSupervisorRequests';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';

export type SupervisorResponseState = { request: SupervisorRequest; action: 'accept' | 'reject' } | null;

/** Decision dialog: accept (with the over-limit consideration when the lecturer is full) or reject. */
export function SupervisorRequestResponseDialog({ state, isFull, onClose, onDone }: {
  state: SupervisorResponseState;
  isFull: boolean;
  onClose: () => void;
  /** Called after a successful decision, e.g. to close the detail modal too. */
  onDone?: () => void;
}) {
  const respond = useRespondSupervisorRequest();
  const [text, setText] = useState('');
  if (!state) return null;
  const accept = state.action === 'accept';
  const needsReason = accept && isFull;
  const min = accept ? (needsReason ? 10 : 0) : 5;
  const disabledReason = text.trim().length < min ? `Isi minimal ${min} karakter.` : null;

  const submit = () => {
    const dto = accept
      ? { action: 'accept' as const, approvalNote: needsReason ? null : text || null, lecturerOverquotaReason: needsReason ? text : null }
      : { action: 'reject' as const, rejectionReason: text };
    respond.mutate({ id: state.request.id, dto }, { onSuccess: () => { setText(''); onClose(); onDone?.(); } });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accept ? 'Terima Permohonan Pembimbing' : 'Tolak Permohonan Pembimbing'}</DialogTitle>
          <DialogDescription>
            {accept
              ? needsReason
                ? 'Anda sudah mencapai batas bimbingan. Penerimaan diteruskan ke Ketua Departemen beserta pertimbangan Anda (misal proyeksi kelulusan).'
                : 'Mahasiswa menjadi bimbingan Anda (Pembimbing 1) dan menunggu Penetapan Pembimbing.'
              : 'Alasan penolakan dikirim ke mahasiswa. Draf mahasiswa tetap tersimpan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="supervisor-request-text">
            {accept ? (needsReason ? 'Pertimbangan menerima di atas batas (minimal 10 karakter)' : 'Catatan untuk mahasiswa (opsional)') : 'Alasan penolakan (minimal 5 karakter)'}
          </Label>
          <Textarea id="supervisor-request-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <span title={disabledReason ?? undefined}>
            <Button variant={accept ? 'default' : 'destructive'} disabled={Boolean(disabledReason) || respond.isPending} onClick={submit}>
              {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {accept ? (needsReason ? 'Teruskan ke Ketua Departemen' : 'Terima') : 'Tolak'}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
