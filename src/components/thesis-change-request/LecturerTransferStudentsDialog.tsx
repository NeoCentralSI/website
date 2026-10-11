import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitTransfer, useSupervisorOptions } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { toTitleCaseName } from '@/lib/text';
import { SUPERVISOR_POSITION_LABELS, type SupervisorPosition } from '@/lib/thesisLabels';

export interface TransferStudent {
  thesisId: string;
  name: string;
  identityNumber: string | null;
  /** The position this lecturer holds on the thesis, which is the one handed over. */
  position: SupervisorPosition | null;
}

const MIN_REASON = 10;

/**
 * "Alihkan Mahasiswa": hand the lecturer's own position on several theses over to one
 * lecturer. Each student becomes one change request with the same batch; the target
 * lecturer and the Ketua Departemen then decide.
 */
export function LecturerTransferStudentsDialog({ open, onOpenChange, students, currentLecturerId, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: TransferStudent[];
  currentLecturerId?: string | null;
  onSuccess?: () => void;
}) {
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const { data: options, isLoading } = useSupervisorOptions(undefined, open);
  const submit = useSubmitTransfer();

  useEffect(() => { if (open) { setTargetId(''); setReason(''); } }, [open]);

  // The target must be allowed to hold every position that is handed over.
  const positions = useMemo(
    () => [...new Set(students.map((student) => student.position).filter((p): p is SupervisorPosition => !!p))],
    [students],
  );
  const candidates = useMemo(
    () =>
      (options ?? []).filter(
        (option) => option.id !== currentLecturerId && positions.every((position) => option.positions.includes(position)),
      ),
    [options, currentLecturerId, positions],
  );

  const problem = students.length === 0
    ? 'Pilih minimal satu mahasiswa.'
    : !targetId
      ? 'Pilih dosen tujuan.'
      : reason.trim().length < MIN_REASON
        ? `Alasan minimal ${MIN_REASON} karakter.`
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alihkan Mahasiswa</DialogTitle>
          <DialogDescription>
            Posisi Anda sebagai pembimbing dialihkan ke dosen tujuan. Setiap mahasiswa menjadi satu Pengajuan Perubahan
            Tugas Akhir; perubahan berlaku setelah dosen tujuan setuju dan Ketua Departemen memutuskan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mahasiswa yang dialihkan ({students.length})</Label>
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
              {students.map((student) => (
                <li key={student.thesisId} className="flex items-center justify-between gap-2">
                  <span className="truncate" title={student.name}>
                    {toTitleCaseName(student.name)} <span className="text-muted-foreground">· {student.identityNumber ?? '-'}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {student.position ? SUPERVISOR_POSITION_LABELS[student.position] : '-'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-target">Dosen tujuan</Label>
            {isLoading ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="transfer-target"><SelectValue placeholder="Pilih dosen" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{toTitleCaseName(option.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Hanya dosen yang memiliki peran {positions.map((position) => SUPERVISOR_POSITION_LABELS[position]).join(' dan ') || 'pembimbing'} yang ditampilkan.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-reason">Alasan pengalihan</Label>
            <Textarea id="transfer-reason" value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} />
          </div>

          {problem && <p className="text-xs text-muted-foreground">Belum dapat dikirim: {problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Batal</Button>
          <Button
            disabled={!!problem || submit.isPending}
            onClick={() =>
              submit.mutate(
                { thesisIds: students.map((student) => student.thesisId), newSupervisorId: targetId, reason: reason.trim() },
                { onSuccess: () => { onOpenChange(false); onSuccess?.(); } },
              )
            }
          >
            {submit.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Ajukan Pengalihan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
