import { useState } from 'react';
import { CalendarClock, CheckCheck, History, Play, Plus, SkipForward, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThesisEventStatusBadge, type ThesisEventStatus } from '@/components/shared/ThesisEventStatusBadge';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { useDevToolsFinalStages, useDevToolsMutations } from '@/hooks/dev-tools/useDevTools';
import { devToolsService } from '@/services/devTools.service';
import type { DevToolsEventCard, DevToolsEventKind, DevToolsEventTarget, DevToolsFinalStages, DevToolsScheduleDto } from '@/types/devTools.types';
import type { ThesisLifecycleStatus } from '@/lib/thesisLabels';
import {
  DevToolsEffectsDialog,
  DevToolsStudentPicker,
  EVENT_TARGETS,
  EVENT_TARGET_LABELS,
  type PendingAction,
  type PickedStudent,
} from './DevToolsFinalStagesShared';

const KIND_LABELS: Record<DevToolsEventKind, { title: string; noun: string }> = {
  seminar: { title: 'Seminar Hasil', noun: 'seminar' },
  defence: { title: 'Sidang TA', noun: 'sidang' },
};
const AVAILABILITY_LABELS: Record<string, string> = { pending: 'Menunggu jawaban', available: 'Bersedia', unavailable: 'Tidak bersedia' };

export function formatEventDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
const clock = (value: string | null) => (value ? value.replace(':', '.') : '-');

/** DevTools tab "Seminar & Sidang": status, schedule and data of one student's seminar and defence. */
export function DevToolsFinalStagesPanel() {
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const { data, isLoading } = useDevToolsFinalStages(student?.id ?? null);
  const mutations = useDevToolsMutations();
  const [pending, setPending] = useState<PendingAction | null>(null);

  return (
    <div className="space-y-4">
      <DevToolsStudentPicker value={student} onChange={setStudent} />
      {!student && <EmptyState title="Pilih Mahasiswa" description="Cari nama atau NIM untuk melihat seminar dan sidangnya" size="sm" />}
      {student && isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="h-4 w-4" />Memuat</div>}
      {student && data && !data.thesis && <EmptyState title="Belum Ada Tugas Akhir" description="Mahasiswa ini belum punya tugas akhir" size="sm" />}
      {student && data?.thesis && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{data.thesis.title ?? 'Tanpa judul'}</span>
            <ThesisStatusBadge status={data.thesis.status as ThesisLifecycleStatus} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(['seminar', 'defence'] as DevToolsEventKind[]).map((kind) => (
              <EventCard key={kind} kind={kind} data={data} mutations={mutations} onAction={setPending} />
            ))}
          </div>
        </>
      )}
      <DevToolsEffectsDialog action={pending} onClose={() => setPending(null)} isSubmitting={mutations.isSubmitting} />
    </div>
  );
}

function EventCard({ kind, data, mutations, onAction }: {
  kind: DevToolsEventKind;
  data: DevToolsFinalStages;
  mutations: ReturnType<typeof useDevToolsMutations>;
  onAction: (action: PendingAction) => void;
}) {
  const event = kind === 'seminar' ? data.seminar : data.defence;
  const guard = data.guards[kind];
  const { title, noun } = KIND_LABELS[kind];
  const studentId = data.student.id;
  const running = !!event && !['failed', 'cancelled'].includes(event.status);
  const [createTarget, setCreateTarget] = useState<DevToolsEventTarget>('registered');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const changeStatus = (target: DevToolsEventTarget) =>
    onAction({
      title: `Ubah status ${title}`,
      description: `${data.student.fullName} → ${EVENT_TARGET_LABELS[target]}`,
      confirmLabel: 'Ubah Status',
      preview: () => devToolsService.previewEvent(studentId, kind, 'change', target),
      run: () => mutations.setEventStatus(studentId, kind, target, 'change'),
    });
  const create = () =>
    onAction({
      title: `Buat ${noun}`,
      description: `${data.student.fullName} · status ${EVENT_TARGET_LABELS[createTarget]}`,
      confirmLabel: `Buat ${noun}`,
      preview: () => devToolsService.previewEvent(studentId, kind, 'create', createTarget),
      run: () => mutations.setEventStatus(studentId, kind, createTarget, 'create'),
    });
  const remove = () =>
    onAction({
      title: `Hapus ${noun}`,
      description: data.student.fullName,
      confirmLabel: `Hapus ${noun}`,
      destructive: true,
      preview: () => devToolsService.previewEvent(studentId, kind, 'delete'),
      run: () => mutations.deleteEvent(studentId, kind),
    });
  const approveRevisions = () =>
    onAction({
      title: 'Setujui semua revisi',
      description: `${title} · ${data.student.fullName}`,
      confirmLabel: 'Setujui Semua',
      preview: () => devToolsService.previewEvent(studentId, kind, 'approve-revisions'),
      run: () => mutations.approveRevisions(studentId, kind),
    });
  const schedule = (body: DevToolsScheduleDto) => event && mutations.setEventSchedule(kind, event.id, body);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {event && <ThesisEventStatusBadge status={event.displayStatus as ThesisEventStatus} />}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {event ? <EventDetails kind={kind} event={event} history={data.history[kind]} /> : (
          <p className="text-muted-foreground">Belum mendaftar {noun}{data.history[kind] ? ` (${data.history[kind]} percobaan sebelumnya)` : ''}</p>
        )}

        {event && event.status !== 'cancelled' && (
          <div className="flex flex-wrap items-center gap-2">
            <GuardedTooltip reason={guard}>
              <Select value="" onValueChange={(value) => changeStatus(value as DevToolsEventTarget)} disabled={!!guard || mutations.isSubmitting}>
                <SelectTrigger className="h-9 w-[200px]" aria-label={`Ubah status ${title}`}><SelectValue placeholder="Ubah status" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TARGETS.filter((t) => t !== event.status).map((target) => (
                    <SelectItem key={target} value={target}>{EVENT_TARGET_LABELS[target]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </GuardedTooltip>
            {event.status === 'passed_with_revision' && !event.revision.finalizedAt && (
              <Button variant="outline" size="sm" onClick={approveRevisions} disabled={mutations.isSubmitting}>
                <CheckCheck className="mr-1.5 h-4 w-4" />Setujui Semua Revisi
              </Button>
            )}
          </div>
        )}

        {event?.date && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => schedule({ preset: 'now' })} disabled={mutations.isSubmitting}><Play className="mr-1.5 h-4 w-4" />Mulai Sekarang</Button>
            <Button variant="outline" size="sm" onClick={() => schedule({ preset: 'past' })} disabled={mutations.isSubmitting}><History className="mr-1.5 h-4 w-4" />Sudah Lewat</Button>
            <Button variant="outline" size="sm" onClick={() => schedule({ preset: 'tomorrow' })} disabled={mutations.isSubmitting}><SkipForward className="mr-1.5 h-4 w-4" />Besok</Button>
            <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)} disabled={mutations.isSubmitting}><CalendarClock className="mr-1.5 h-4 w-4" />Ubah Jadwal</Button>
          </div>
        )}

        {!running && (
          <GuardedTooltip reason={kind === 'seminar' ? guard : null}>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={createTarget} onValueChange={(value) => setCreateTarget(value as DevToolsEventTarget)} disabled={kind === 'seminar' && !!guard}>
                <SelectTrigger className="h-9 w-[200px]" aria-label={`Status ${noun} baru`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TARGETS.map((target) => <SelectItem key={target} value={target}>{EVENT_TARGET_LABELS[target]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={create} disabled={mutations.isSubmitting || (kind === 'seminar' && !!guard)}>
                <Plus className="mr-1.5 h-4 w-4" />Buat {noun === 'seminar' ? 'Seminar' : 'Sidang'}
              </Button>
            </div>
          </GuardedTooltip>
        )}

        {event && (
          <div className="flex justify-end">
            <GuardedTooltip reason={guard}>
              <Button variant="outline" size="sm" className="text-destructive" onClick={remove} disabled={!!guard || mutations.isSubmitting}>
                <Trash2 className="mr-1.5 h-4 w-4" />Hapus {noun === 'seminar' ? 'Seminar' : 'Sidang'}
              </Button>
            </GuardedTooltip>
          </div>
        )}
      </CardContent>
      {event && (
        <ScheduleDialog
          open={scheduleOpen}
          event={event}
          title={title}
          isSubmitting={mutations.isSubmitting}
          onOpenChange={setScheduleOpen}
          onSave={async (body) => {
            const ok = await schedule(body);
            if (ok !== null) setScheduleOpen(false);
          }}
        />
      )}
    </Card>
  );
}

/** A disabled control explains itself in a tooltip. */
function GuardedTooltip({ reason, children }: { reason: string | null; children: React.ReactNode }) {
  if (!reason) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="inline-flex">{children}</span></TooltipTrigger>
      <TooltipContent className="max-w-xs">{reason}</TooltipContent>
    </Tooltip>
  );
}

function EventDetails({ kind, event, history }: { kind: DevToolsEventKind; event: DevToolsEventCard; history: number }) {
  return (
    <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
      <dt className="text-muted-foreground">Jadwal</dt>
      <dd>{event.date ? `${formatEventDate(event.date)} · ${clock(event.startTime)}–${clock(event.endTime)}${event.room ? ` · ${event.room}` : ''}` : 'Belum dijadwalkan'}</dd>
      <dt className="text-muted-foreground">Penguji</dt>
      <dd>
        {event.examiners.length === 0 ? 'Belum ditetapkan' : (
          <ul className="space-y-0.5">
            {event.examiners.map((examiner) => (
              <li key={examiner.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{examiner.name}</span>
                <span className="text-muted-foreground">
                  {AVAILABILITY_LABELS[examiner.availabilityStatus] ?? examiner.availabilityStatus}
                  {examiner.score !== null && ` · nilai ${examiner.score}${examiner.submitted ? '' : ' (draf)'}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </dd>
      {kind === 'defence' && (
        <>
          <dt className="text-muted-foreground">Nilai pembimbing</dt>
          <dd>{event.supervisorScore ?? '-'}{event.supervisorScore !== null && event.supervisorScore !== undefined && !event.supervisorSubmitted ? ' (draf)' : ''}</dd>
        </>
      )}
      <dt className="text-muted-foreground">Nilai akhir</dt>
      <dd>{event.finalScore !== null ? `${Math.round(event.finalScore * 100) / 100}${event.grade ? ` (${event.grade})` : ''}` : '-'}</dd>
      {event.revision.total > 0 && (
        <>
          <dt className="text-muted-foreground">Revisi</dt>
          <dd>{event.revision.approved}/{event.revision.total} disetujui{event.revision.finalizedAt ? ' · difinalkan' : ''}</dd>
        </>
      )}
      <dt className="text-muted-foreground">Dokumen resmi</dt>
      <dd>{event.officialDocuments > 0 ? `${event.officialDocuments} berlaku` : '-'}</dd>
      {history > 0 && (
        <>
          <dt className="text-muted-foreground">Riwayat</dt>
          <dd>{history} percobaan sebelumnya</dd>
        </>
      )}
    </dl>
  );
}

function ScheduleDialog({ open, event, title, isSubmitting, onOpenChange, onSave }: {
  open: boolean;
  event: DevToolsEventCard;
  title: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (body: DevToolsScheduleDto) => void;
}) {
  const [form, setForm] = useState({ date: event.date ?? '', startTime: event.startTime ?? '09:00', endTime: event.endTime ?? '11:00' });
  const invalid = !form.date || !form.startTime || !form.endTime || form.startTime >= form.endTime;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) setForm({ date: event.date ?? '', startTime: event.startTime ?? '09:00', endTime: event.endTime ?? '11:00' }); onOpenChange(next); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Jadwal {title}</DialogTitle>
          <DialogDescription>Ruangan, penguji, dan status tidak berubah</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="devtools-event-date">Tanggal<span className="text-destructive"> *</span></Label>
            <Input id="devtools-event-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="devtools-event-start">Mulai (WIB)</Label>
            <Input id="devtools-event-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="devtools-event-end">Selesai (WIB)</Label>
            <Input id="devtools-event-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
        {form.startTime >= form.endTime && <p className="text-xs text-destructive">Jam mulai harus sebelum jam selesai.</p>}
        <p className="text-xs text-muted-foreground">Tanggal lampau diizinkan; validasi jadwal aplikasi dilewati.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || invalid} onClick={() => onSave(form)}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
