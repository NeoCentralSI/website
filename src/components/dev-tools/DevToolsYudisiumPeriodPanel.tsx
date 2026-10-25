import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarClock, CalendarX, DoorOpen } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDevToolsMutations, useDevToolsYudisiumPeriods } from '@/hooks/dev-tools/useDevTools';
import { formatDateTimeWib } from '@/lib/text';
import type { DevToolsPeriodDatesDto, DevToolsPeriodStatus, DevToolsYudisiumPeriod } from '@/types/devTools.types';
import { isoToWibInput, wibInputToIso } from './devToolsDate';
import { TruncatedText } from './DevToolsShared';

export const PERIOD_STATUS_LABELS: Record<DevToolsPeriodStatus, string> = {
  draft: 'Draf',
  open: 'Pendaftaran Dibuka',
  closed: 'Pendaftaran Ditutup',
  ongoing: 'Berlangsung Hari Ini',
  completed: 'Selesai',
};
const PERIOD_STATUS_VARIANT: Record<DevToolsPeriodStatus, 'outline' | 'success' | 'warning' | 'info' | 'secondary'> = {
  draft: 'outline',
  open: 'success',
  closed: 'warning',
  ongoing: 'info',
  completed: 'secondary',
};

const DATE_FIELDS = [
  ['registrationOpenDate', 'Buka pendaftaran', 'datetime'],
  ['registrationCloseDate', 'Tutup pendaftaran', 'datetime'],
  ['eventDate', 'Acara yudisium', 'datetime'],
  ['exitSurveyOpenDate', 'Buka exit survey', 'date'],
  ['exitSurveyCloseDate', 'Tutup exit survey', 'date'],
] as const;
type DateKey = (typeof DATE_FIELDS)[number][0];

/** DevTools tab "Periode Yudisium": the dates of each period, which decide its status. */
export function DevToolsYudisiumPeriodPanel() {
  const { data, isLoading, isFetching, refetch } = useDevToolsYudisiumPeriods();
  const mutations = useDevToolsMutations();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DevToolsYudisiumPeriod | null>(null);
  const rows = data ?? [];

  const columns = useMemo<Column<DevToolsYudisiumPeriod>[]>(() => [
    { key: 'name', header: 'Periode', render: (row) => <div className="max-w-[200px]"><TruncatedText text={row.name} className="text-sm font-medium" /><div className="text-xs text-muted-foreground">{row.participantCount} peserta</div></div> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={PERIOD_STATUS_VARIANT[row.status]}>{PERIOD_STATUS_LABELS[row.status]}</Badge> },
    { key: 'open', header: 'Buka', className: 'text-xs', render: (row) => formatDateTimeWib(row.registrationOpenDate) },
    { key: 'close', header: 'Tutup', className: 'text-xs', render: (row) => formatDateTimeWib(row.registrationCloseDate) },
    { key: 'event', header: 'Acara', className: 'text-xs', render: (row) => formatDateTimeWib(row.eventDate) },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          {[
            ['open', 'Buka pendaftaran sekarang', DoorOpen],
            ['close', 'Tutup pendaftaran sekarang', CalendarX],
            ['event', 'Acara hari ini', CalendarCheck],
          ].map(([preset, label, Icon]) => {
            const IconComponent = Icon as typeof DoorOpen;
            return (
              <Tooltip key={preset as string}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label as string} disabled={mutations.isSubmitting}
                    onClick={() => mutations.setYudisiumPeriodDates(row.id, { preset: preset as DevToolsPeriodDatesDto['preset'] })}>
                    <IconComponent className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label as string}</TooltipContent>
              </Tooltip>
            );
          })}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ubah tanggal" onClick={() => setEditing(row)}>
                <CalendarClock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ubah tanggal</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ], [mutations]);

  return (
    <>
      <CustomTable
        columns={columns}
        data={rows.slice((page - 1) * 10, page * 10)}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={rows.length}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        actions={<RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />}
        emptyText="Belum ada periode yudisium."
      />
      <PeriodDatesDialog period={editing} isSubmitting={mutations.isSubmitting} onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          const ok = await mutations.setYudisiumPeriodDates(editing.id, body);
          if (ok !== null) setEditing(null);
        }} />
    </>
  );
}

function toForm(period: DevToolsYudisiumPeriod): Record<DateKey, string> {
  return {
    registrationOpenDate: isoToWibInput(period.registrationOpenDate),
    registrationCloseDate: isoToWibInput(period.registrationCloseDate),
    eventDate: isoToWibInput(period.eventDate),
    exitSurveyOpenDate: period.exitSurveyOpenDate?.slice(0, 10) ?? '',
    exitSurveyCloseDate: period.exitSurveyCloseDate?.slice(0, 10) ?? '',
  };
}

function PeriodDatesDialog({ period, isSubmitting, onClose, onSave }: {
  period: DevToolsYudisiumPeriod | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (body: DevToolsPeriodDatesDto) => void;
}) {
  const [form, setForm] = useState<Record<DateKey, string> | null>(null);
  const current = period ? form ?? toForm(period) : null;
  if (!period || !current) return null;
  const original = toForm(period);
  const body: DevToolsPeriodDatesDto = {};
  for (const [key, , kind] of DATE_FIELDS) {
    if (current[key] === original[key]) continue;
    body[key] = current[key] === '' ? null : kind === 'date' ? `${current[key]}T00:00:00+07:00` : wibInputToIso(current[key]) ?? null;
  }
  const outOfOrder = !!current.registrationOpenDate && !!current.registrationCloseDate && current.registrationOpenDate > current.registrationCloseDate;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { setForm(null); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ubah Tanggal Periode</DialogTitle>
          <DialogDescription>{period.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {DATE_FIELDS.map(([key, label, kind]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`period-${key}`}>{label}{kind === 'datetime' ? ' (WIB)' : ''}</Label>
              <Input id={`period-${key}`} type={kind === 'date' ? 'date' : 'datetime-local'} value={current[key]}
                onChange={(e) => setForm({ ...current, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        {outOfOrder && <p className="text-xs text-destructive">Tanggal buka pendaftaran harus sebelum tanggal tutup.</p>}
        <p className="text-xs text-muted-foreground">Status periode dihitung dari tanggal. Validasi form aplikasi dilewati.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setForm(null); onClose(); }} disabled={isSubmitting}>Batal</Button>
          <Button disabled={isSubmitting || outOfOrder || Object.keys(body).length === 0} onClick={() => { onSave(body); setForm(null); }}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
