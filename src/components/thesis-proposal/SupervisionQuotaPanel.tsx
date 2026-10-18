import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SectionHeading } from '@/components/shared/PageHeading';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import {
  useClearPeriodLimits,
  useSetGeneralLimits,
  useSetPeriodLimits,
  useSupervisionLoadOverview,
} from '@/hooks/thesis-proposal/useSupervisionQuota';
import { BADGE_COLUMN_WIDTH, CLIP_CELL } from '@/lib/tableColumnWidths';
import { formatLecturerName } from '@/lib/text';
import { SUPERVISION_LOAD_LEVEL_LABELS, type SupervisionLoadLevel } from '@/lib/thesisLabels';
import type { LecturerLoadRow, SupervisionLimits } from '@/types/thesis-proposal.types';

const SOURCE_LABELS = { period: 'batas periode', general: 'batas umum', default: 'batas bawaan sistem (8/10)' } as const;

/** Beban: the full lecturers first (Paket P8, "Semua" sorted by what needs attention). */
const LEVEL_ORDER: SupervisionLoadLevel[] = ['full', 'near_limit', 'available'];
const LEVEL_OPTIONS = [{ label: 'Semua', value: '' }, ...LEVEL_ORDER.map((value) => ({ label: SUPERVISION_LOAD_LEVEL_LABELS[value], value }))];

function LimitsForm({
  idPrefix,
  value,
  disabled,
  onSave,
  onClear,
  saving,
}: {
  idPrefix: string;
  value: SupervisionLimits | null;
  disabled: boolean;
  onSave: (limits: SupervisionLimits) => void;
  onClear?: () => void;
  saving: boolean;
}) {
  const [soft, setSoft] = useState(value ? String(value.softLimit) : '');
  const [hard, setHard] = useState(value ? String(value.hardLimit) : '');
  useEffect(() => {
    setSoft(value ? String(value.softLimit) : '');
    setHard(value ? String(value.hardLimit) : '');
  }, [value]);
  const softNumber = Number(soft);
  const hardNumber = Number(hard);
  let reason: string | null = null;
  if (!Number.isInteger(softNumber) || !Number.isInteger(hardNumber) || softNumber < 1 || hardNumber < 1) reason = 'Isi batas lunak dan batas keras (bilangan bulat).';
  else if (softNumber > hardNumber) reason = 'Batas lunak tidak boleh lebih besar dari batas keras.';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-soft`}>Batas lunak (peringatan)</Label>
          <Input id={`${idPrefix}-soft`} type="number" min={1} max={100} value={soft} disabled={disabled} onChange={(e) => setSoft(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-hard`}>Batas keras</Label>
          <Input id={`${idPrefix}-hard`} type="number" min={1} max={100} value={hard} disabled={disabled} onChange={(e) => setHard(e.target.value)} />
        </div>
      </div>
      {!disabled && (
        <div className="flex flex-col gap-2">
          {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onClear && value && <Button variant="outline" size="sm" onClick={onClear} disabled={saving}>Hapus Batas Periode</Button>}
            <span title={reason ?? undefined} className="inline-flex">
              <Button size="sm" disabled={Boolean(reason) || saving} onClick={() => onSave({ softLimit: softNumber, hardLimit: hardNumber })}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
              </Button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Batas bimbingan (rencana 10.1; Paket P8): batas umum, batas per periode yang menimpanya, dan
 * beban tiap dosen terhadap batas yang berlaku dalam satu tabel. Kadep dan Sekdep mengubah
 * batas; di tab "Beban Dosen" Penetapan Pembimbing hanya tabelnya yang tampil.
 */
export function SupervisionQuotaPanel({ canEdit, showLimits = true }: { canEdit: boolean; showLimits?: boolean }) {
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState<SupervisionLoadLevel | ''>('');
  const overview = useSupervisionLoadOverview(academicYearId);
  const data = overview.data;
  const { academicYears } = useAcademicYears({ pageSize: 50 });
  const setGeneral = useSetGeneralLimits();
  const setPeriod = useSetPeriodLimits();
  const clearPeriod = useClearPeriodLimits();
  const saving = setGeneral.isPending || setPeriod.isPending || clearPeriod.isPending;

  const rows = useMemo(() => {
    const rank = (row: LecturerLoadRow) => LEVEL_ORDER.indexOf(row.level);
    const sorted = [...(data?.lecturers ?? [])].sort((a, b) => rank(a) - rank(b) || b.activeCount - a.activeCount || (a.fullName ?? '').localeCompare(b.fullName ?? ''));
    return level ? sorted.filter((row) => row.level === level) : sorted;
  }, [data, level]);
  const table = useLocalTable(rows, (row, term) => haystack(row.fullName, row.scienceGroup?.name).includes(term));

  if (overview.isLoading && !data) return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
  if (overview.error || !data) return <p className="text-sm text-destructive">{overview.error instanceof Error ? overview.error.message : 'Gagal memuat batas bimbingan.'}</p>;

  const periodId = data.academicYear?.id;
  const counts = { full: (data.lecturers ?? []).filter((r) => r.level === 'full').length, near: (data.lecturers ?? []).filter((r) => r.level === 'near_limit').length };
  const hardLimit = data.applicable.hardLimit;

  const columns: Column<LecturerLoadRow>[] = [
    {
      key: 'lecturer',
      header: 'Dosen',
      width: 240,
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={formatLecturerName(row.fullName)}>{formatLecturerName(row.fullName)}</p>
          <p className="truncate text-xs text-muted-foreground">{row.scienceGroup?.name ?? 'KBK belum diisi'}</p>
        </div>
      ),
    },
    {
      key: 'load',
      header: 'Beban',
      width: BADGE_COLUMN_WIDTH.supervisionLoad,
      className: CLIP_CELL,
      render: (row) => <SupervisionLoadBadge activeCount={row.activeCount} hardLimit={hardLimit} level={row.level} className="whitespace-nowrap" />,
      filter: { type: 'select', value: level, onChange: (value) => { setLevel(value as SupervisionLoadLevel | ''); table.resetPage(); }, options: LEVEL_OPTIONS },
    },
    {
      key: 'breakdown',
      header: 'Rincian',
      className: CLIP_CELL,
      render: (row) => {
        const b = row.breakdown;
        const first = `Menunggu penetapan ${b.waitingAssignment} · Proposal ${b.proposal} · Penelitian ${b.research}`;
        const second = `BSS ${b.onLeave} · Sebagai Pembimbing 2: ${b.asSupervisor2}`;
        return (
          <div className="min-w-0 text-sm leading-snug">
            <p className="truncate" title={first}>{first}</p>
            <p className="truncate text-xs text-muted-foreground" title={second}>{second}</p>
          </div>
        );
      },
    },
    {
      key: 'accepting',
      header: 'Pengajuan Baru',
      width: BADGE_COLUMN_WIDTH.acceptingRequests,
      className: CLIP_CELL,
      render: (row) => row.acceptingRequests
        ? <Badge variant="success" className="whitespace-nowrap">Diterima</Badge>
        : <Badge variant="outline" className="whitespace-nowrap">Ditutup Dosen</Badge>,
    },
  ];

  const loadDescription = `Semua relasi pembimbing aktif pada TA yang belum selesai, fase apa pun, termasuk mahasiswa yang diterima tetapi belum ditetapkan. ${counts.full} dosen penuh, ${counts.near} dosen mendekati batas`;

  return (
    <div className="space-y-6">
      {showLimits && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Batas yang berlaku untuk {data.academicYear?.label ?? 'periode ini'}: {data.applicable.softLimit} (lunak) dan {hardLimit} (keras), dari{' '}
            {SOURCE_LABELS[data.applicable.source]}. Melewati batas lunak hanya peringatan; dosen yang sudah mencapai batas keras tetap bisa
            menerima mahasiswa sebagai Pengajuan di Atas Kuota yang diputuskan Ketua Departemen.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Batas Umum</CardTitle>
                <CardDescription>Berlaku di semua periode yang tidak punya batas sendiri.</CardDescription>
              </CardHeader>
              <CardContent>
                <LimitsForm idPrefix="batas-umum" value={data.general} disabled={!canEdit} saving={saving} onSave={(limits) => setGeneral.mutate(limits)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Batas Periode</CardTitle>
                  <CardDescription>Menimpa batas umum untuk satu semester; hapus agar kembali ke batas umum.</CardDescription>
                </div>
                <Select value={periodId ?? ''} onValueChange={(value) => setAcademicYearId(value)}>
                  <SelectTrigger aria-label="Periode" className="w-full sm:w-52"><SelectValue placeholder="Pilih periode" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.semester === 'genap' ? 'Genap' : 'Ganjil'} {String(year.year)}{year.isActive ? ' (Berjalan)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <LimitsForm
                  idPrefix="batas-periode"
                  value={data.period}
                  disabled={!canEdit || !periodId}
                  saving={saving}
                  onSave={(limits) => periodId && setPeriod.mutate({ academicYearId: periodId, limits })}
                  onClear={() => periodId && clearPeriod.mutate(periodId)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {showLimits ? <SectionHeading title="Beban Dosen" description={loadDescription} /> : <p className="text-sm text-muted-foreground">{loadDescription}</p>}
        <CustomTable
          columns={columns}
          {...table.tableProps}
          isRefreshing={overview.isFetching}
          subtleRefresh
          enableColumnFilters
          tableClassName="table-fixed min-w-[900px]"
          searchPlaceholder="Cari nama dosen atau KBK..."
          emptyText={table.search || level ? 'Tidak ditemukan' : 'Belum ada data dosen.'}
          rowKey={(row) => row.lecturerId}
          actions={<RefreshButton onClick={() => void overview.refetch()} isRefreshing={overview.isFetching} />}
        />
      </div>
    </div>
  );
}
