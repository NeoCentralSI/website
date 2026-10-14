import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { SearchableCombobox } from '@/components/shared/SearchableCombobox';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTopics } from '@/hooks/milestone/useMilestone';
import {
  useSaveSupervisorRequestDraft,
  useSubmitSupervisorRequest,
  useSupervisorCatalog,
} from '@/hooks/thesis-proposal/useSupervisorRequests';
import { formatLecturerName } from '@/lib/text';
import type { ResearchPermitStatus, SupervisorRequestDraft, SupervisorRequestInput } from '@/types/thesis-proposal.types';

const MIN_TITLE = 12;
const MIN_JUSTIFICATION = 20;

type Route = 'direct' | 'department';

interface FormState {
  route: Route;
  lecturerId: string;
  topicId: string;
  proposedTitle: string;
  backgroundSummary: string;
  problemStatement: string;
  proposedSolution: string;
  researchObject: string;
  researchPermitStatus: ResearchPermitStatus | '';
  studentJustification: string;
}

function fromDraft(draft: SupervisorRequestDraft | null): FormState {
  return {
    route: draft && !draft.lecturerId && draft.lastSubmittedAt ? 'department' : 'direct',
    lecturerId: draft?.lecturerId ?? '',
    topicId: draft?.topicId ?? '',
    proposedTitle: draft?.proposedTitle ?? '',
    backgroundSummary: draft?.backgroundSummary ?? '',
    problemStatement: draft?.problemStatement ?? '',
    proposedSolution: draft?.proposedSolution ?? '',
    researchObject: draft?.researchObject ?? '',
    researchPermitStatus: draft?.researchPermitStatus ?? '',
    studentJustification: draft?.studentJustification ?? '',
  };
}

function toInput(form: FormState): SupervisorRequestInput {
  return {
    lecturerId: form.route === 'direct' ? form.lecturerId || null : null,
    topicId: form.topicId || null,
    proposedTitle: form.proposedTitle.trim() || null,
    backgroundSummary: form.backgroundSummary.trim() || null,
    problemStatement: form.problemStatement.trim() || null,
    proposedSolution: form.proposedSolution.trim() || null,
    researchObject: form.researchObject.trim() || null,
    researchPermitStatus: form.researchPermitStatus || null,
    studentJustification: form.studentJustification.trim() || null,
  };
}

/** The first reason the request cannot be sent yet, or null (also checked by the server). */
export function getSubmitBlockReason(form: FormState, chosenFull: boolean): string | null {
  if (form.route === 'direct' && !form.lecturerId) return 'Pilih dosen pembimbing, atau gunakan jalur Ditetapkan Departemen.';
  if (!form.topicId) return 'Pilih topik penelitian.';
  if (form.proposedTitle.trim().length < MIN_TITLE) return `Judul minimal ${MIN_TITLE} karakter.`;
  if (!form.backgroundSummary.trim()) return 'Isi latar belakang singkat.';
  if (!form.problemStatement.trim()) return 'Isi rumusan masalah.';
  if (!form.proposedSolution.trim()) return 'Isi rencana solusi.';
  if (!form.researchObject.trim()) return 'Isi objek penelitian.';
  if (!form.researchPermitStatus) return 'Pilih status izin penelitian.';
  if (chosenFull && form.studentJustification.trim().length < MIN_JUSTIFICATION) {
    return `Dosen ini sudah mencapai batas bimbingan. Tulis alasan memilih dosen ini, minimal ${MIN_JUSTIFICATION} karakter.`;
  }
  return null;
}

/** Formulir Pengajuan Pembimbing dengan dua jalur: Pilih Dosen Sendiri dan Ditetapkan Departemen. */
export function StudentSupervisorRequestForm({ draft }: { draft: SupervisorRequestDraft | null }) {
  const [form, setForm] = useState<FormState>(() => fromDraft(draft));
  const { data: catalog = [], isLoading: catalogLoading } = useSupervisorCatalog(true);
  const { data: topics = [] } = useTopics();
  const saveDraft = useSaveSupervisorRequestDraft();
  const submit = useSubmitSupervisorRequest();

  useEffect(() => setForm(fromDraft(draft)), [draft]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const chosen = useMemo(() => catalog.find((lecturer) => lecturer.lecturerId === form.lecturerId) ?? null, [catalog, form.lecturerId]);
  const chosenFull = form.route === 'direct' && chosen?.level === 'full';
  const blockReason = getSubmitBlockReason(form, chosenFull);
  const busy = saveDraft.isPending || submit.isPending;

  const lecturerOptions = catalog
    .filter((lecturer) => lecturer.acceptingRequests)
    .map((lecturer) => ({
      value: lecturer.lecturerId,
      label: `${formatLecturerName(lecturer.fullName)} · ${lecturer.activeCount}/${lecturer.hardLimit}`,
      keywords: [lecturer.fullName ?? '', lecturer.scienceGroup?.name ?? '', ...lecturer.supervisedTopics],
    }));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Jalur pengajuan</Label>
        <RadioGroup value={form.route} onValueChange={(value) => set('route', value as Route)} className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="direct" aria-label="Pilih Dosen Sendiri" />
            <span>
              <span className="block text-sm font-medium">Pilih Dosen Sendiri</span>
              <span className="block text-xs text-muted-foreground">Anda memilih calon pembimbing; dosen memutuskan.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="department" aria-label="Ditetapkan Departemen" />
            <span>
              <span className="block text-sm font-medium">Ditetapkan Departemen</span>
              <span className="block text-xs text-muted-foreground">Ketua Departemen memilihkan pembimbing.</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      {form.route === 'direct' && (
        <div className="space-y-2">
          <Label>Dosen pembimbing</Label>
          <SearchableCombobox
            ariaLabel="Dosen pembimbing"
            options={lecturerOptions}
            value={form.lecturerId}
            onChange={(value) => set('lecturerId', value)}
            placeholder={catalogLoading ? 'Memuat daftar dosen…' : 'Pilih dosen'}
            searchPlaceholder="Cari nama, KBK, atau topik"
            emptyText="Dosen tidak ditemukan"
            fallbackLabel={draft?.lecturer?.fullName ? formatLecturerName(draft.lecturer.fullName) : undefined}
          />
          {chosen && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <SupervisionLoadBadge activeCount={chosen.activeCount} hardLimit={chosen.hardLimit} level={chosen.level} />
              {chosen.scienceGroup?.name && <span>{chosen.scienceGroup.name}</span>}
              {chosen.supervisedTopics.length > 0 && <span>· Topik bimbingan: {chosen.supervisedTopics.join(', ')}</span>}
            </div>
          )}
          {chosen?.level === 'near_limit' && (
            <p className="text-xs text-muted-foreground">Dosen ini mendekati batas bimbingan. Pengajuan tetap bisa dikirim.</p>
          )}
          {chosenFull && (
            <Alert>
              <AlertDescription>
                Dosen ini sudah mencapai batas bimbingan. Pengajuan tetap bisa dikirim sebagai Pengajuan di Atas Kuota:
                bila dosen bersedia, Ketua Departemen yang memutuskan. Tulis alasan akademik Anda di bawah.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proposal-topic">Topik penelitian</Label>
          <Select value={form.topicId} onValueChange={(value) => set('topicId', value)}>
            <SelectTrigger id="proposal-topic" aria-label="Topik penelitian"><SelectValue placeholder="Pilih topik" /></SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal-permit">Izin penelitian</Label>
          <Select value={form.researchPermitStatus} onValueChange={(value) => set('researchPermitStatus', value as ResearchPermitStatus)}>
            <SelectTrigger id="proposal-permit" aria-label="Izin penelitian"><SelectValue placeholder="Pilih status izin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Sudah disetujui</SelectItem>
              <SelectItem value="in_process">Sedang diproses</SelectItem>
              <SelectItem value="not_approved">Belum disetujui</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposal-title">Judul rencana tugas akhir</Label>
        <Input id="proposal-title" value={form.proposedTitle} maxLength={255} onChange={(e) => set('proposedTitle', e.target.value)}
          placeholder="Judul yang spesifik, bukan nama topik" />
      </div>
      {([
        ['backgroundSummary', 'Latar belakang singkat'],
        ['problemStatement', 'Rumusan masalah'],
        ['proposedSolution', 'Rencana solusi'],
      ] as const).map(([key, label]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`proposal-${key}`}>{label}</Label>
          <Textarea id={`proposal-${key}`} rows={3} value={form[key]} onChange={(e) => set(key, e.target.value)} />
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="proposal-object">Objek penelitian</Label>
        <Input id="proposal-object" value={form.researchObject} maxLength={255} onChange={(e) => set('researchObject', e.target.value)} />
      </div>
      {chosenFull && (
        <div className="space-y-2">
          <Label htmlFor="proposal-justification">Alasan memilih dosen ini (minimal {MIN_JUSTIFICATION} karakter)</Label>
          <Textarea id="proposal-justification" rows={3} value={form.studentJustification} onChange={(e) => set('studentJustification', e.target.value)} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        {blockReason && <p className="mr-auto text-xs text-muted-foreground">{blockReason}</p>}
        <Button variant="outline" disabled={busy} onClick={() => saveDraft.mutate(toInput(form))}>
          {saveDraft.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Draf
        </Button>
        <span title={blockReason ?? undefined}>
          <Button disabled={busy || Boolean(blockReason)} onClick={() => submit.mutate(toInput(form))}>
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajukan
          </Button>
        </span>
      </div>
    </div>
  );
}
