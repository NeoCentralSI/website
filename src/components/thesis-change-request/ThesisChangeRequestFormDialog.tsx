import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableCombobox } from '@/components/shared/SearchableCombobox';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitChangeRequest, useSupervisorOptions } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { formatLecturerName } from '@/lib/text';
import {
  CHANGE_REQUEST_TYPE_LABELS,
  SUPERVISOR_POSITION_LABELS,
  type ChangeRequestType,
  type SupervisorPosition,
} from '@/lib/thesisLabels';
import { getTopics } from '@/services/topic.service';
import type { ThesisChangeContext } from '@/types/thesis-change-request.types';
import { toSupervisorComboboxOptions } from './supervisorOptions';

const KEEP_TOPIC = 'keep';
const CHANGE_TYPES = Object.keys(CHANGE_REQUEST_TYPE_LABELS) as ChangeRequestType[];
const MIN_REASON = 10;

/**
 * "Ajukan Perubahan": choose what to change (title, one supervisor position, or both) and
 * fill it in the way the TA-05 form asks. The current values are shown next to the new ones.
 */
export function ThesisChangeRequestFormDialog({ open, onOpenChange, context }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ThesisChangeContext;
}) {
  const thesis = context.thesis;
  // K34 (Paket E6): a kind the rules block now is disabled with its reason.
  const blockOf = (type: ChangeRequestType) => context.typeBlocks?.[type] ?? null;
  const firstOpenType = CHANGE_TYPES.find((type) => !blockOf(type)) ?? 'title';
  const [requestType, setRequestType] = useState<ChangeRequestType>(firstOpenType);
  const [newTitle, setNewTitle] = useState('');
  const [newTopicId, setNewTopicId] = useState(KEEP_TOPIC);
  const [position, setPosition] = useState<SupervisorPosition>('pembimbing_1');
  const [newSupervisorId, setNewSupervisorId] = useState('');
  const [reason, setReason] = useState('');

  const changesTitle = requestType !== 'supervisor';
  const changesSupervisor = requestType !== 'title';
  const submit = useSubmitChangeRequest();
  const { data: options, isLoading: optionsLoading } = useSupervisorOptions(position, open && changesSupervisor);
  const { data: topics } = useQuery({ queryKey: ['topics'], queryFn: getTopics, enabled: open && changesTitle, retry: false });

  useEffect(() => {
    if (!open) return;
    setRequestType(firstOpenType);
    setNewTitle(thesis?.title ?? '');
    setNewTopicId(KEEP_TOPIC);
    setPosition('pembimbing_1');
    setNewSupervisorId('');
    setReason('');
  }, [open, thesis?.title, firstOpenType]);

  const supervisors = thesis?.supervisors ?? [];
  const current = supervisors.find((s) => s.position === position) ?? null;
  const p1 = supervisors.find((s) => s.position === 'pembimbing_1') ?? null;

  // The lecturer who holds the position cannot replace themselves, and Pembimbing 1 cannot
  // be moved down to Pembimbing 2.
  const candidates = useMemo(
    () =>
      (options ?? []).filter(
        (option) => option.id !== current?.lecturerId && !(position === 'pembimbing_2' && option.id === p1?.lecturerId),
      ),
    [options, current?.lecturerId, position, p1?.lecturerId],
  );

  if (!thesis) return null;

  const titleTrimmed = newTitle.trim();
  const titleUnchanged = titleTrimmed === (thesis.title ?? '').trim() && newTopicId === KEEP_TOPIC;
  const problem =
    changesTitle && titleTrimmed.length < 5
      ? 'Judul baru minimal 5 karakter.'
      : changesTitle && titleUnchanged
        ? 'Judul baru masih sama dengan judul saat ini.'
        : changesSupervisor && !newSupervisorId
          ? 'Pilih pembimbing baru.'
          : reason.trim().length < MIN_REASON
            ? `Alasan minimal ${MIN_REASON} karakter.`
            : null;

  const handleSubmit = () => {
    submit.mutate(
      {
        thesisId: thesis.id,
        requestType,
        reason: reason.trim(),
        ...(changesTitle ? { newTitle: titleTrimmed, newTopicId: newTopicId === KEEP_TOPIC ? null : newTopicId } : {}),
        ...(changesSupervisor ? { supervisorRole: position, newSupervisorId } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Perubahan Tugas Akhir</DialogTitle>
          <DialogDescription>
            Perubahan diterapkan setelah disetujui dosen terkait dan diputuskan Ketua Departemen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="change-type">Jenis perubahan</Label>
            <Select value={requestType} onValueChange={(value) => setRequestType(value as ChangeRequestType)}>
              <SelectTrigger id="change-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANGE_TYPES.map((value) => (
                  <SelectItem key={value} value={value} disabled={!!blockOf(value)}>
                    {CHANGE_REQUEST_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {CHANGE_TYPES.filter((value) => blockOf(value)).map((value) => (
              <p key={value} className="text-xs text-muted-foreground">
                {CHANGE_REQUEST_TYPE_LABELS[value]} tidak tersedia: {blockOf(value)}
              </p>
            ))}
          </div>

          {changesTitle && (
            <>
              <div className="space-y-2">
                <Label>Judul saat ini</Label>
                <p className="rounded-md bg-muted px-3 py-2 text-sm [overflow-wrap:anywhere]">{thesis.title || '(belum ada judul)'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="change-new-title">Judul baru</Label>
                <Textarea id="change-new-title" value={newTitle} maxLength={1000} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              {!!topics?.length && (
                <div className="space-y-2">
                  <Label htmlFor="change-topic">Topik (opsional)</Label>
                  <Select value={newTopicId} onValueChange={setNewTopicId}>
                    <SelectTrigger id="change-topic"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={KEEP_TOPIC}>Tetap: {thesis.topic?.name ?? 'belum ada topik'}</SelectItem>
                      {topics.filter((topic) => topic.id !== thesis.topic?.id).map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {changesSupervisor && (
            <>
              <div className="space-y-2">
                <Label htmlFor="change-position">Posisi pembimbing yang diubah</Label>
                <Select value={position} onValueChange={(value) => { setPosition(value as SupervisorPosition); setNewSupervisorId(''); }}>
                  <SelectTrigger id="change-position"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SUPERVISOR_POSITION_LABELS) as SupervisorPosition[]).map((value) => (
                      <SelectItem key={value} value={value}>{SUPERVISOR_POSITION_LABELS[value]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{SUPERVISOR_POSITION_LABELS[position]} saat ini</Label>
                <Input readOnly value={current ? formatLecturerName(current.name) : 'Belum ada (pembimbing akan ditambahkan)'} />
              </div>
              <div className="space-y-2">
                <Label>{current ? 'Pembimbing pengganti' : 'Pembimbing yang ditambahkan'}</Label>
                {optionsLoading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  // Paket E6 (4): the same searchable picker as "Alihkan", with each lecturer's load.
                  <SearchableCombobox
                    ariaLabel={current ? 'Pembimbing pengganti' : 'Pembimbing yang ditambahkan'}
                    options={toSupervisorComboboxOptions(candidates)}
                    value={newSupervisorId}
                    onChange={setNewSupervisorId}
                    placeholder="Pilih dosen"
                    searchPlaceholder="Cari nama atau NIP..."
                    emptyText="Dosen tidak ditemukan."
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Hanya dosen dengan peran {SUPERVISOR_POSITION_LABELS[position]} yang ditampilkan. Satu pengajuan mengubah satu posisi.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="change-reason">Alasan perubahan</Label>
            <Textarea id="change-reason" value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} />
          </div>

          {problem && <p className="text-xs text-muted-foreground">Belum dapat dikirim: {problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!!problem || submit.isPending}>
            {submit.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Kirim Pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
