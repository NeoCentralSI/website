import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { SearchableCombobox } from '@/components/shared/SearchableCombobox';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAssignableLecturers,
  useKadepSupervisorDecision,
  useRequestRecommendations,
} from '@/hooks/thesis-proposal/useSupervisorRequests';
import { formatLecturerName } from '@/lib/text';
import type { KadepDecisionDto, SupervisorRequest } from '@/types/thesis-proposal.types';

export type KadepAction = KadepDecisionDto['action'];

const TITLES: Record<KadepAction, string> = {
  approve: 'Setujui Pengajuan',
  redirect: 'Alihkan ke Dosen Lain',
  request_revision: 'Minta Revisi',
  reject: 'Tolak Pengajuan',
};

/**
 * Keputusan Ketua Departemen (R12). Setujui: dosen pilihan mahasiswa (di atas kuota) atau dosen
 * pilihan Kadep (jalur departemen). Alihkan: dosen lain, boleh yang penuh. Minta revisi dan tolak
 * hanya untuk jalur departemen.
 */
export function KadepSupervisorRequestDecisionDialog({
  request,
  action,
  onClose,
  onDone,
}: {
  request: SupervisorRequest;
  action: KadepAction;
  onClose: () => void;
  /** After a successful decision (e.g. close the detail modal behind this one). */
  onDone?: () => void;
}) {
  const decide = useKadepSupervisorDecision();
  const needsTarget = action === 'redirect' || (action === 'approve' && request.route === 'department');
  const { data: recommendations } = useRequestRecommendations(needsTarget ? request.id : null);
  const { data: assignable } = useAssignableLecturers(needsTarget ? request.id : null);
  const [target, setTarget] = useState('');
  const [notes, setNotes] = useState('');

  const options = useMemo(
    () => (assignable?.lecturers ?? []).map((lecturer) => ({
      value: lecturer.lecturerId,
      label: `${formatLecturerName(lecturer.fullName)} · ${lecturer.activeCount}/${lecturer.hardLimit}`,
      keywords: [lecturer.fullName ?? '', lecturer.scienceGroup?.name ?? ''],
    })),
    [assignable],
  );
  const chosen = assignable?.lecturers.find((lecturer) => lecturer.lecturerId === target) ?? null;

  let disabledReason: string | null = null;
  if (needsTarget && !target) disabledReason = 'Pilih dosen pembimbing.';
  else if (action === 'request_revision' && notes.trim().length < 10) disabledReason = 'Catatan revisi minimal 10 karakter.';

  const submit = () => {
    decide.mutate(
      { id: request.id, dto: { action, targetLecturerId: needsTarget ? target : null, notes: notes.trim() || null } },
      { onSuccess: () => { onDone?.(); onClose(); } },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            {action === 'approve' && request.route === 'over_quota'
              ? `${formatLecturerName(request.lecturer?.fullName)} menjadi Pembimbing 1 walaupun sudah mencapai batas bimbingan.`
              : action === 'reject'
                ? 'Mahasiswa diberi tahu dan drafnya tetap tersimpan.'
                : action === 'request_revision'
                  ? 'Mahasiswa memperbarui isian sesuai catatan lalu mengajukan ulang.'
                  : 'Dosen yang dipilih menjadi Pembimbing 1 mahasiswa ini.'}
          </DialogDescription>
        </DialogHeader>
        {needsTarget && (
          <div className="space-y-3">
            {(recommendations?.alternatives?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <Label>Rekomendasi (kelompok keilmuan sama, belum penuh)</Label>
                <div className="flex flex-wrap gap-2">
                  {recommendations!.alternatives.map((lecturer) => (
                    <Button key={lecturer.lecturerId} size="sm" variant={target === lecturer.lecturerId ? 'default' : 'outline'}
                      onClick={() => setTarget(lecturer.lecturerId)}>
                      {formatLecturerName(lecturer.fullName)} ({lecturer.activeCount}/{lecturer.hardLimit})
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {recommendations?.message && <p className="text-xs text-muted-foreground">{recommendations.message}</p>}
            <div className="space-y-2">
              <Label>Dosen pembimbing</Label>
              <SearchableCombobox ariaLabel="Dosen pembimbing" options={options} value={target} onChange={setTarget}
                placeholder="Pilih dosen" searchPlaceholder="Cari nama atau kelompok keilmuan" emptyText="Dosen tidak ditemukan" />
              {chosen && <SupervisionLoadBadge activeCount={chosen.activeCount} hardLimit={chosen.hardLimit} level={chosen.level} />}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="kadep-decision-notes">{action === 'request_revision' ? 'Catatan revisi (minimal 10 karakter)' : 'Catatan (opsional)'}</Label>
          <Textarea id="kadep-decision-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <span title={disabledReason ?? undefined} className="inline-flex">
            <Button variant={action === 'reject' ? 'destructive' : 'default'} disabled={Boolean(disabledReason) || decide.isPending} onClick={submit}>
              {decide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{TITLES[action]}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
