import { useState } from 'react';
import { CheckCircle2, FilePen, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useLecturerProposalRevision, useReviewProposalRevision } from '@/hooks/thesis-proposal/useProposalRevision';
import type { ProposalRevisionAction } from '@/types/thesis-proposal.types';
import { RevisionRow } from './ProposalRevisionRow';

const MIN_NOTES = 10;

/** Why "Minta Revisi" cannot be sent yet, or null. */
export function getRevisionNotesProblem(notes: string): string | null {
  return notes.trim().length < MIN_NOTES ? `Catatan revisi wajib diisi minimal ${MIN_NOTES} karakter.` : null;
}

/**
 * Proposal Revisi di detail mahasiswa bimbingan (Lanjutan Paket P): TA yang mengulang proposal
 * lewat evaluasi bimbingan. Pembimbing 1 menyetujui (TA kembali ke Penelitian, masa bimbingan
 * mulai lagi) atau meminta revisi dengan catatan. Pembimbing 2 dan pembaca lain hanya melihat.
 */
export function LecturerProposalRevisionCard({ thesisId }: { thesisId: string }) {
  const { data, isLoading, error } = useLecturerProposalRevision(thesisId);
  const review = useReviewProposalRevision(thesisId);
  const [dialog, setDialog] = useState<ProposalRevisionAction | null>(null);
  const [notes, setNotes] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6"><Spinner className="h-5 w-5" /></CardContent>
      </Card>
    );
  }
  if (error || !data?.applicable) return null;

  const current = data.current;
  const notesProblem = dialog === 'request_revision' ? getRevisionNotesProblem(notes) : null;
  const close = () => {
    setDialog(null);
    setNotes('');
  };
  const confirm = () => {
    if (!current || !dialog || notesProblem) return;
    review.mutate(
      { id: current.id, action: dialog, notes: dialog === 'request_revision' ? notes.trim() : null },
      { onSuccess: close },
    );
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FilePen className="h-4 w-4" />
          Proposal Revisi (Mengulang Proposal)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {current ? <RevisionRow revision={current} /> : <p className="text-muted-foreground">Mahasiswa belum mengunggah proposal revisi.</p>}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {!data.canReview && data.reviewBlockReason && <p className="mr-auto text-xs text-muted-foreground">{data.reviewBlockReason}</p>}
          <span title={data.reviewBlockReason ?? undefined}>
            <Button size="sm" variant="outline" disabled={!data.canReview || review.isPending} onClick={() => setDialog('request_revision')}>
              Minta Revisi
            </Button>
          </span>
          <span title={data.reviewBlockReason ?? undefined}>
            <Button size="sm" disabled={!data.canReview || review.isPending} onClick={() => setDialog('approve')}>
              <CheckCircle2 className="mr-2 h-4 w-4" />Setujui
            </Button>
          </span>
        </div>

        {data.history.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Unggahan Sebelumnya</p>
            <ul className="divide-y rounded-lg border">
              {data.history.map((revision) => (
                <li key={revision.id} className="px-3 py-2">
                  <RevisionRow revision={revision} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === 'approve' ? 'Setujui Proposal Revisi?' : 'Minta Revisi Proposal'}</DialogTitle>
            <DialogDescription>
              {dialog === 'approve'
                ? 'Tugas akhir kembali ke fase Penelitian dan masa bimbingan dihitung ulang mulai hari ini. Mahasiswa dan Pembimbing 2 menerima notifikasi.'
                : 'Mahasiswa menerima catatan ini dan mengunggah proposal revisi yang baru.'}
            </DialogDescription>
          </DialogHeader>
          {dialog === 'request_revision' && (
            <div className="space-y-2">
              <Label htmlFor="proposal-revision-notes">Catatan revisi</Label>
              <Textarea
                id="proposal-revision-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Bagian yang perlu diperbaiki"
                rows={4}
              />
              {notes.length > 0 && notesProblem && <p className="text-xs text-destructive">{notesProblem}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={review.isPending}>Batal</Button>
            <span title={notesProblem ?? undefined}>
              <Button onClick={confirm} disabled={Boolean(notesProblem) || review.isPending}>
                {review.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialog === 'approve' ? 'Setujui' : 'Kirim Permintaan Revisi'}
              </Button>
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
