import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { FieldError, FieldLabel, focusFirstInvalid } from '@/components/shared/RequiredField';
import { SearchableCombobox, type ComboboxOption } from '@/components/shared/SearchableCombobox';
import { SoftWarning } from '@/components/shared/SoftWarning';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { CatalogLecturer, ResearchPermitStatus, SupervisorRequestDraft, SupervisorRequestInput } from '@/types/thesis-proposal.types';

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

type FieldKey =
  | 'lecturerId'
  | 'topicId'
  | 'researchPermitStatus'
  | 'proposedTitle'
  | 'backgroundSummary'
  | 'problemStatement'
  | 'proposedSolution'
  | 'researchObject'
  | 'studentJustification';

/** Element id of each field, in the order of the form (the first missing one gets the focus). */
const FIELD_IDS: Record<FieldKey, string> = {
  lecturerId: 'proposal-lecturer',
  topicId: 'proposal-topic',
  researchPermitStatus: 'proposal-permit',
  proposedTitle: 'proposal-title',
  backgroundSummary: 'proposal-backgroundSummary',
  problemStatement: 'proposal-problemStatement',
  proposedSolution: 'proposal-proposedSolution',
  researchObject: 'proposal-object',
  studentJustification: 'proposal-justification',
};
const FIELD_ORDER = Object.keys(FIELD_IDS) as FieldKey[];

/** What each missing or too-short field needs (also checked by the server). */
export function getFieldErrors(form: FormState, chosenFull: boolean): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (form.route === 'direct' && !form.lecturerId) errors.lecturerId = 'Pilih dosen pembimbing, atau gunakan jalur Ditetapkan Departemen.';
  if (!form.topicId) errors.topicId = 'Pilih topik penelitian.';
  if (!form.researchPermitStatus) errors.researchPermitStatus = 'Pilih status izin penelitian.';
  if (form.proposedTitle.trim().length < MIN_TITLE) errors.proposedTitle = `Judul minimal ${MIN_TITLE} karakter.`;
  if (!form.backgroundSummary.trim()) errors.backgroundSummary = 'Isi latar belakang singkat.';
  if (!form.problemStatement.trim()) errors.problemStatement = 'Isi rumusan masalah.';
  if (!form.proposedSolution.trim()) errors.proposedSolution = 'Isi rencana solusi.';
  if (!form.researchObject.trim()) errors.researchObject = 'Isi objek penelitian.';
  if (chosenFull && form.studentJustification.trim().length < MIN_JUSTIFICATION) {
    errors.studentJustification = `Dosen ini sudah mencapai batas bimbingan. Tulis alasan memilih dosen ini, minimal ${MIN_JUSTIFICATION} karakter.`;
  }
  return errors;
}

/** The first reason the request cannot be sent yet, or null. */
export function getSubmitBlockReason(form: FormState, chosenFull: boolean): string | null {
  const errors = getFieldErrors(form, chosenFull);
  return FIELD_ORDER.map((key) => errors[key]).find(Boolean) ?? null;
}

const SHOWN_TOPICS = 2;
export const CLOSED_INTAKE_REASON = 'Dosen sedang menutup penerimaan pengajuan.';

/** "Topik A, Topik B +3": the first topics, the rest in the tooltip. */
export function summarizeTopics(topics: string[]): { text: string; title: string | undefined } {
  if (topics.length === 0) return { text: 'Belum ada topik', title: undefined };
  const rest = topics.length - SHOWN_TOPICS;
  return { text: `${topics.slice(0, SHOWN_TOPICS).join(', ')}${rest > 0 ? ` +${rest}` : ''}`, title: topics.join(', ') };
}

const topicsOf = (lecturer: CatalogLecturer) => (lecturer.offeredTopics?.length ? lecturer.offeredTopics : lecturer.supervisedTopics);
const groupOf = (lecturer: CatalogLecturer) => lecturer.scienceGroup?.name ?? 'Kelompok keilmuan belum diisi';

function LoadBadge({ lecturer }: { lecturer: CatalogLecturer }) {
  return lecturer.acceptingRequests
    ? <SupervisionLoadBadge activeCount={lecturer.activeCount} hardLimit={lecturer.hardLimit} level={lecturer.level} className="shrink-0 whitespace-nowrap" />
    : <Badge variant="outline" className="shrink-0 whitespace-nowrap">Ditutup Dosen</Badge>;
}

/**
 * The lecturers as options of a searchable dropdown: name, kelompok keilmuan, the offered topics
 * (short, all of them in the tooltip) and the load. The search matches name, kelompok keilmuan
 * and topic. A full lecturer stays selectable; one who closed intake is listed but disabled.
 */
export function toLecturerOptions(lecturers: CatalogLecturer[]): ComboboxOption[] {
  return lecturers.map((lecturer) => {
    const topics = topicsOf(lecturer);
    const summary = summarizeTopics(topics);
    return {
      value: lecturer.lecturerId,
      label: formatLecturerName(lecturer.fullName),
      keywords: [lecturer.scienceGroup?.name ?? '', ...topics],
      description: `${groupOf(lecturer)} · ${summary.text}`,
      descriptionTitle: summary.title ? `${groupOf(lecturer)} · ${summary.title}` : undefined,
      badge: <LoadBadge lecturer={lecturer} />,
      disabled: !lecturer.acceptingRequests,
      disabledReason: lecturer.acceptingRequests ? undefined : CLOSED_INTAKE_REASON,
    };
  });
}

/** The chosen lecturer, kept in view under the dropdown. */
function ChosenLecturer({ lecturer }: { lecturer: CatalogLecturer }) {
  const summary = summarizeTopics(topicsOf(lecturer));
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{formatLecturerName(lecturer.fullName)}</p>
        <p className="text-xs text-muted-foreground">{groupOf(lecturer)}</p>
        <p className="truncate text-xs text-muted-foreground" title={summary.title}>Topik: {summary.text}</p>
      </div>
      <LoadBadge lecturer={lecturer} />
    </div>
  );
}

/**
 * Formulir Pengajuan Pembimbing dengan dua jalur: Pilih Dosen Sendiri dan Ditetapkan Departemen.
 * On its own page; the lecturer is chosen from a searchable dropdown. Required fields carry a
 * red asterisk: Ajukan is never disabled for an empty field; a click marks what is missing and
 * scrolls to the first one. Batal and a sent request go back to the Proposal page; Simpan Draf
 * stays.
 */
export function StudentSupervisorRequestForm({ draft, onClose, onSubmitted }: {
  draft: SupervisorRequestDraft | null;
  onClose?: () => void;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => fromDraft(draft));
  const [checked, setChecked] = useState(false);
  const { data: catalog = [], isLoading: catalogLoading } = useSupervisorCatalog(true);
  const { data: topics = [] } = useTopics();
  const saveDraft = useSaveSupervisorRequestDraft();
  const submit = useSubmitSupervisorRequest();

  useEffect(() => setForm(fromDraft(draft)), [draft]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const chosen = useMemo(() => catalog.find((lecturer) => lecturer.lecturerId === form.lecturerId) ?? null, [catalog, form.lecturerId]);
  const lecturerOptions = useMemo(() => toLecturerOptions(catalog), [catalog]);
  const chosenFull = form.route === 'direct' && chosen?.level === 'full';
  const errors = checked ? getFieldErrors(form, chosenFull) : {};
  const busy = saveDraft.isPending || submit.isPending;

  const send = () => {
    const missing = getFieldErrors(form, chosenFull);
    setChecked(true);
    if (Object.keys(missing).length > 0) {
      focusFirstInvalid(FIELD_ORDER.map((key) => FIELD_IDS[key]), Object.fromEntries(FIELD_ORDER.map((key) => [FIELD_IDS[key], missing[key]])));
      return;
    }
    submit.mutate(toInput(form), { onSuccess: () => onSubmitted?.() });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <FieldLabel required>Jalur pengajuan</FieldLabel>
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
        <div id={FIELD_IDS.lecturerId} className="space-y-2">
          <FieldLabel required>Dosen pembimbing</FieldLabel>
          <SearchableCombobox
            options={lecturerOptions}
            value={form.lecturerId}
            onChange={(value) => set('lecturerId', value)}
            ariaLabel="Dosen pembimbing"
            placeholder={catalogLoading ? 'Memuat dosen...' : 'Pilih dosen pembimbing'}
            searchPlaceholder="Cari nama, kelompok keilmuan, atau topik..."
            emptyText="Dosen tidak ditemukan."
            fallbackLabel={form.lecturerId && draft?.lecturer?.fullName ? formatLecturerName(draft.lecturer.fullName) : undefined}
            disabled={catalogLoading}
          />
          <FieldError message={errors.lecturerId} />
          {chosen && <ChosenLecturer lecturer={chosen} />}
          {chosen?.level === 'near_limit' && (
            <p className="text-xs text-muted-foreground">Dosen ini mendekati batas bimbingan. Pengajuan tetap bisa dikirim.</p>
          )}
          {chosenFull && (
            <SoftWarning title="Dosen ini sudah mencapai batas bimbingan">
              Pengajuan tetap bisa dikirim sebagai Pengajuan di Atas Kuota: bila dosen bersedia, Ketua Departemen yang
              memutuskan. Tulis alasan akademik Anda di bawah.
            </SoftWarning>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor={FIELD_IDS.topicId} required>Topik penelitian</FieldLabel>
          <Select value={form.topicId} onValueChange={(value) => set('topicId', value)}>
            <SelectTrigger id={FIELD_IDS.topicId} aria-label="Topik penelitian" aria-invalid={Boolean(errors.topicId)}><SelectValue placeholder="Pilih topik" /></SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.topicId} />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor={FIELD_IDS.researchPermitStatus} required>Izin penelitian</FieldLabel>
          <Select value={form.researchPermitStatus} onValueChange={(value) => set('researchPermitStatus', value as ResearchPermitStatus)}>
            <SelectTrigger id={FIELD_IDS.researchPermitStatus} aria-label="Izin penelitian" aria-invalid={Boolean(errors.researchPermitStatus)}>
              <SelectValue placeholder="Pilih status izin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Sudah disetujui</SelectItem>
              <SelectItem value="in_process">Sedang diproses</SelectItem>
              <SelectItem value="not_approved">Belum disetujui</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.researchPermitStatus} />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor={FIELD_IDS.proposedTitle} required>Judul rencana tugas akhir</FieldLabel>
        <Input id={FIELD_IDS.proposedTitle} value={form.proposedTitle} maxLength={255} onChange={(e) => set('proposedTitle', e.target.value)}
          aria-invalid={Boolean(errors.proposedTitle)} placeholder="Judul yang spesifik, bukan nama topik" />
        <FieldError message={errors.proposedTitle} />
      </div>
      {([
        ['backgroundSummary', 'Latar belakang singkat'],
        ['problemStatement', 'Rumusan masalah'],
        ['proposedSolution', 'Rencana solusi'],
      ] as const).map(([key, label]) => (
        <div key={key} className="space-y-2">
          <FieldLabel htmlFor={FIELD_IDS[key]} required>{label}</FieldLabel>
          <Textarea id={FIELD_IDS[key]} rows={3} value={form[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={Boolean(errors[key])} />
          <FieldError message={errors[key]} />
        </div>
      ))}
      <div className="space-y-2">
        <FieldLabel htmlFor={FIELD_IDS.researchObject} required>Objek penelitian</FieldLabel>
        <Input id={FIELD_IDS.researchObject} value={form.researchObject} maxLength={255} onChange={(e) => set('researchObject', e.target.value)}
          aria-invalid={Boolean(errors.researchObject)} />
        <FieldError message={errors.researchObject} />
      </div>
      {chosenFull && (
        <div className="space-y-2">
          <FieldLabel htmlFor={FIELD_IDS.studentJustification} required>Alasan memilih dosen ini (minimal {MIN_JUSTIFICATION} karakter)</FieldLabel>
          <Textarea id={FIELD_IDS.studentJustification} rows={3} value={form.studentJustification}
            onChange={(e) => set('studentJustification', e.target.value)} aria-invalid={Boolean(errors.studentJustification)} />
          <FieldError message={errors.studentJustification} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        {onClose && <Button variant="outline" disabled={busy} onClick={onClose}>Batal</Button>}
        <Button variant="outline" disabled={busy} onClick={() => saveDraft.mutate(toInput(form))}>
          {saveDraft.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Draf
        </Button>
        <Button disabled={busy} onClick={send}>
          {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajukan
        </Button>
      </div>
    </div>
  );
}
