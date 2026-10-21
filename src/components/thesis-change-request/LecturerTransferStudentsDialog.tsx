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
import { SearchableCombobox } from '@/components/shared/SearchableCombobox';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitTransfer, useSupervisorOptions } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { toTitleCaseName } from '@/lib/text';
import { SUPERVISOR_POSITION_LABELS, type SupervisorPosition } from '@/lib/thesisLabels';
import type { MyStudentItem } from '@/services/lecturerGuidance.service';
import { toSupervisorComboboxOptions } from './supervisorOptions';

export interface TransferStudent {
  thesisId: string;
  name: string;
  identityNumber: string | null;
  /** The position this lecturer holds on the thesis, which is the one handed over. */
  position: SupervisorPosition | null;
}

const MIN_REASON = 10;

/** Supervisor position of a "my students" row, from the role name the API sends. */
export function toSupervisorPosition(roleName?: string | null): SupervisorPosition | null {
  const normalized = String(roleName ?? '').toLowerCase().replace(/[\s_]/g, '');
  if (normalized === 'pembimbing1') return 'pembimbing_1';
  if (normalized === 'pembimbing2') return 'pembimbing_2';
  return null;
}

/**
 * "Alihkan Mahasiswa" hands over this lecturer's own active position on a research thesis
 * (the rows the backend marks `changeRequest.canTransfer`, ticked in the table).
 */
export function toTransferStudents(rows: MyStudentItem[]): TransferStudent[] {
  return rows
    .filter((row) => row.thesisId && row.changeRequest?.canTransfer)
    .map((row) => ({
      thesisId: row.thesisId as string,
      name: row.fullName,
      identityNumber: row.identityNumber ?? null,
      position: toSupervisorPosition(row.roles?.[0]),
    }));
}

/**
 * "Alihkan Mahasiswa": hand the lecturer's own position on several theses over to one
 * lecturer. Each student becomes one change request with the same batch; the target
 * lecturer and the Ketua Departemen then decide. Opened by "Alihkan (N)" in
 * the toolbar of Mahasiswa Bimbingan with the ticked students; here only the target lecturer
 * and the reason are chosen.
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
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
              {students.map((student) => (
                <li key={student.thesisId} className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate" title={student.name}>
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
            <Label>Dosen tujuan</Label>
            {isLoading ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <SearchableCombobox
                ariaLabel="Dosen tujuan"
                options={toSupervisorComboboxOptions(candidates)}
                value={targetId}
                onChange={setTargetId}
                placeholder="Pilih dosen"
                searchPlaceholder="Cari nama atau NIP..."
                emptyText="Dosen tidak ditemukan."
              />
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
