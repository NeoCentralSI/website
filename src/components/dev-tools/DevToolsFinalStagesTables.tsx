/**
 * DEV TOOLS — status and dates of Seminar Hasil, Sidang, yudisium periods and participants.
 * A change is written directly: no side effect, no application rule, no notification.
 * ⚠️ DELETE THIS DIRECTORY (components/dev-tools/) when dev tools are no longer needed.
 */
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, History, Pencil, Play } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDevToolsMutations, useDevToolsTable } from '@/hooks/dev-tools/useDevTools';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { formatDateTimeWib } from '@/lib/text';
import type {
  DevToolsEventKind,
  DevToolsEventPatch,
  DevToolsEventRow,
  DevToolsEventStatus,
  DevToolsParticipantRow,
  DevToolsParticipantStatus,
  DevToolsPeriodPatch,
  DevToolsYudisiumPeriodRow,
} from '@/types/devTools.types';
import { isoToWibInput, wibInputToIso } from './devToolsDate';
import { TruncatedText } from './DevToolsShared';

export const EVENT_STATUS_LABELS: Record<DevToolsEventStatus, string> = {
  registered: 'Terdaftar',
  verified: 'Terverifikasi',
  examiner_assigned: 'Penguji Ditetapkan',
  scheduled: 'Terjadwal',
  passed: 'Lulus',
  passed_with_revision: 'Lulus dengan Revisi',
  failed: 'Tidak Lulus',
  cancelled: 'Dibatalkan',
};
export const PARTICIPANT_STATUS_LABELS: Record<DevToolsParticipantStatus, string> = {
  registered: 'Terdaftar',
  eligible: 'Memenuhi Syarat',
  appointed: 'Ditetapkan',
  rejected: 'Ditolak',
  finalized: 'Final',
};

const statusOptions = (labels: Record<string, string>) => [
  { label: 'Semua Status', value: '' },
  ...Object.entries(labels).map(([value, label]) => ({ label, value })),
];

function EditIcon({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label} onClick={onClick}>
          <Pencil className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StudentCell({ name, nim }: { name: string | null; nim: string | null }) {
  return (
    <div className="max-w-[220px]">
      <TruncatedText text={name} className="text-sm font-medium" />
      <div className="text-xs text-muted-foreground">{nim ?? '-'}</div>
    </div>
  );
}

const clock = (value: string | null) => (value ? value.replace(':', '.') : '-');

// ─── Seminar Hasil and Sidang ──────────────────────────────────────────────────────────────

/** DevTools tab "Seminar Hasil" or "Sidang": status, date and time of each attempt. */
export function DevToolsEventTablePanel({ kind }: { kind: DevToolsEventKind }) {
  const noun = kind === 'seminars' ? 'seminar' : 'sidang';
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [status, setStatus] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<DevToolsEventRow | null>(null);
  const mutations = useDevToolsMutations();
  const { data, isLoading, isFetching, refetch } = useDevToolsTable<DevToolsEventRow>(kind, { search: debouncedSearch, status, page, pageSize });

  const columns = useMemo<Column<DevToolsEventRow>[]>(() => [
    { key: 'student', header: 'Mahasiswa', render: (row) => <StudentCell name={row.studentName} nim={row.studentNim} /> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant="outline">{EVENT_STATUS_LABELS[row.status] ?? row.status}</Badge>,
      filter: { type: 'select', value: status, defaultValue: '', options: statusOptions(EVENT_STATUS_LABELS), onChange: (value) => { setStatus(value); setPage(1); } },
    },
    { key: 'date', header: 'Tanggal', className: 'text-sm', render: (row) => row.date ?? '-' },
    { key: 'time', header: 'Jam', className: 'text-sm', render: (row) => (row.startTime ? `${clock(row.startTime)}–${clock(row.endTime)}` : '-') },
    { key: 'actions', header: 'Aksi', className: 'w-16 text-right', render: (row) => <div className="flex justify-end"><EditIcon label={`Ubah ${noun}`} onClick={() => setEditing(row)} /></div> },
  ], [noun, status, setPage]);

  return (
    <>
      <CustomTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau NIM"
        enableColumnFilters
        actions={<RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />}
        emptyText={`Tidak ada ${noun} ditemukan.`}
      />
      <EventDialog
        row={editing}
        title={kind === 'seminars' ? 'Ubah Seminar Hasil' : 'Ubah Sidang'}
        isSubmitting={mutations.isSubmitting}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          const ok = await mutations.patchTable(kind, editing.id, body);
          if (ok !== null) setEditing(null);
        }}
      />
    </>
  );
}

function EventDialog({ row, title, isSubmitting, onClose, onSave }: {
  row: DevToolsEventRow | null;
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (body: DevToolsEventPatch) => void;
}) {
  const [form, setForm] = useState({ status: '', date: '', startTime: '', endTime: '' });
  useEffect(() => {
    if (row) setForm({ status: row.status, date: row.date ?? '', startTime: row.startTime ?? '', endTime: row.endTime ?? '' });
  }, [row]);
  if (!row) return null;

  const body: DevToolsEventPatch = {};
  if (form.status !== row.status) body.status = form.status as DevToolsEventStatus;
  if (form.date !== (row.date ?? '')) body.date = form.date || null;
  if (form.startTime !== (row.startTime ?? '')) body.startTime = form.startTime || null;
  if (form.endTime !== (row.endTime ?? '')) body.endTime = form.endTime || null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />{title}</DialogTitle>
          <DialogDescription>{row.studentName ?? '-'} ({row.studentNim ?? '-'})</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="devtools-event-status">Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger id="devtools-event-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="devtools-event-date">Tanggal</Label>
              <Input id="devtools-event-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devtools-event-start">Mulai (WIB)</Label>
              <Input id="devtools-event-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devtools-event-end">Selesai (WIB)</Label>
              <Input id="devtools-event-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => onSave({ preset: 'now' })}><Play className="mr-1.5 h-4 w-4" />Mulai Sekarang</Button>
            <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => onSave({ preset: 'past' })}><History className="mr-1.5 h-4 w-4" />Sudah Lewat</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Kolom diubah langsung, tanpa efek samping, tanpa validasi aplikasi, dan tanpa notifikasi.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || Object.keys(body).length === 0} onClick={() => onSave(body)}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Yudisium periods ──────────────────────────────────────────────────────────────────────

const PERIOD_FIELDS = [
  ['registrationOpenDate', 'Buka pendaftaran'],
  ['registrationCloseDate', 'Tutup pendaftaran'],
  ['eventDate', 'Acara yudisium'],
] as const;

/** DevTools tab "Periode Yudisium": registration and event dates. */
export function DevToolsYudisiumPeriodTablePanel() {
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<DevToolsYudisiumPeriodRow | null>(null);
  const mutations = useDevToolsMutations();
  const { data, isLoading, isFetching, refetch } = useDevToolsTable<DevToolsYudisiumPeriodRow>('yudisium-periods', { search: debouncedSearch, page, pageSize });

  const columns = useMemo<Column<DevToolsYudisiumPeriodRow>[]>(() => [
    { key: 'name', header: 'Periode', render: (row) => <div className="max-w-[240px]"><TruncatedText text={row.name} className="text-sm font-medium" /></div> },
    { key: 'open', header: 'Buka', className: 'text-xs', render: (row) => formatDateTimeWib(row.registrationOpenDate) },
    { key: 'close', header: 'Tutup', className: 'text-xs', render: (row) => formatDateTimeWib(row.registrationCloseDate) },
    { key: 'event', header: 'Acara', className: 'text-xs', render: (row) => formatDateTimeWib(row.eventDate) },
    { key: 'actions', header: 'Aksi', className: 'w-16 text-right', render: (row) => <div className="flex justify-end"><EditIcon label="Ubah tanggal" onClick={() => setEditing(row)} /></div> },
  ], []);

  return (
    <>
      <CustomTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama periode"
        actions={<RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />}
        emptyText="Tidak ada periode yudisium ditemukan."
      />
      <PeriodDialog
        row={editing}
        isSubmitting={mutations.isSubmitting}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          const ok = await mutations.patchTable('yudisium-periods', editing.id, body);
          if (ok !== null) setEditing(null);
        }}
      />
    </>
  );
}

function PeriodDialog({ row, isSubmitting, onClose, onSave }: {
  row: DevToolsYudisiumPeriodRow | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (body: DevToolsPeriodPatch) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (row) setForm(Object.fromEntries(PERIOD_FIELDS.map(([key]) => [key, isoToWibInput(row[key])])));
  }, [row]);
  if (!row) return null;
  const body: DevToolsPeriodPatch = {};
  let invalid = false;
  for (const [key] of PERIOD_FIELDS) {
    if ((form[key] ?? '') === isoToWibInput(row[key])) continue;
    const iso = wibInputToIso(form[key] ?? '');
    if (iso === undefined) invalid = true;
    else body[key] = iso;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Tanggal Periode</DialogTitle>
          <DialogDescription>{row.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {PERIOD_FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`devtools-period-${key}`}>{label} (WIB)</Label>
              <Input id={`devtools-period-${key}`} type="datetime-local" value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Tanggal diubah langsung, tanpa validasi aplikasi. Status periode dihitung dari tanggal.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || invalid || Object.keys(body).length === 0} onClick={() => onSave(body)}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Yudisium participants ─────────────────────────────────────────────────────────────────

/** DevTools tab "Peserta Yudisium": the participant status. */
export function DevToolsYudisiumParticipantTablePanel() {
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [status, setStatus] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<DevToolsParticipantRow | null>(null);
  const [next, setNext] = useState<DevToolsParticipantStatus | ''>('');
  const mutations = useDevToolsMutations();
  const { data, isLoading, isFetching, refetch } = useDevToolsTable<DevToolsParticipantRow>('yudisium-participants', { search: debouncedSearch, status, page, pageSize });
  useEffect(() => setNext(editing?.status ?? ''), [editing]);

  const columns = useMemo<Column<DevToolsParticipantRow>[]>(() => [
    { key: 'student', header: 'Mahasiswa', render: (row) => <StudentCell name={row.studentName} nim={row.studentNim} /> },
    { key: 'period', header: 'Periode', render: (row) => <div className="max-w-[220px]"><TruncatedText text={row.periodName} className="text-sm" /></div> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant="outline">{PARTICIPANT_STATUS_LABELS[row.status] ?? row.status}</Badge>,
      filter: { type: 'select', value: status, defaultValue: '', options: statusOptions(PARTICIPANT_STATUS_LABELS), onChange: (value) => { setStatus(value); setPage(1); } },
    },
    { key: 'actions', header: 'Aksi', className: 'w-16 text-right', render: (row) => <div className="flex justify-end"><EditIcon label="Ubah status" onClick={() => setEditing(row)} /></div> },
  ], [status, setPage]);

  return (
    <>
      <CustomTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau NIM"
        enableColumnFilters
        actions={<RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />}
        emptyText="Tidak ada peserta yudisium ditemukan."
      />
      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Status Peserta</DialogTitle>
              <DialogDescription>{editing.studentName ?? '-'} · {editing.periodName ?? '-'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="devtools-participant-status">Status</Label>
              <Select value={next} onValueChange={(value) => setNext(value as DevToolsParticipantStatus)}>
                <SelectTrigger id="devtools-participant-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTICIPANT_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Status diubah langsung, tanpa efek samping dan tanpa notifikasi.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={mutations.isSubmitting}>Batal</Button>
              <Button
                disabled={mutations.isSubmitting || !next || next === editing.status}
                onClick={async () => {
                  const ok = await mutations.patchTable('yudisium-participants', editing.id, { status: next as DevToolsParticipantStatus });
                  if (ok !== null) setEditing(null);
                }}
              >
                {mutations.isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan</> : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
