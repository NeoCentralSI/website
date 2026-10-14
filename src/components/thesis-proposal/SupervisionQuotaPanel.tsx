import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { SearchField } from '@/components/shared/SearchField';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import {
  useClearPeriodLimits,
  useSetGeneralLimits,
  useSetPeriodLimits,
  useSupervisionLoadOverview,
} from '@/hooks/thesis-proposal/useSupervisionQuota';
import { formatLecturerName } from '@/lib/text';
import { getSupervisionLoadLevelLabel } from '@/lib/thesisLabels';
import type { SupervisionLimits } from '@/types/thesis-proposal.types';

const SOURCE_LABELS = { period: 'batas periode', general: 'batas umum', default: 'batas bawaan sistem (8/10)' } as const;

function LimitsForm({
  title,
  description,
  value,
  disabled,
  onSave,
  onClear,
  saving,
}: {
  title: string;
  description: string;
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
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${title}-soft`}>Batas lunak (peringatan)</Label>
          <Input id={`${title}-soft`} type="number" min={1} max={100} value={soft} disabled={disabled} onChange={(e) => setSoft(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${title}-hard`}>Batas keras</Label>
          <Input id={`${title}-hard`} type="number" min={1} max={100} value={hard} disabled={disabled} onChange={(e) => setHard(e.target.value)} />
        </div>
      </div>
      {!disabled && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {reason && <p className="mr-auto text-xs text-muted-foreground">{reason}</p>}
          {onClear && value && <Button variant="ghost" size="sm" onClick={onClear} disabled={saving}>Hapus</Button>}
          <Button size="sm" disabled={Boolean(reason) || saving} onClick={() => onSave({ softLimit: softNumber, hardLimit: hardNumber })}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Batas bimbingan (rencana 10.1): batas umum, batas per periode yang menimpanya, dan beban tiap
 * dosen terhadap batas yang berlaku. Kadep dan Sekdep mengubah batas; peran lain hanya membaca.
 */
export function SupervisionQuotaPanel({ canEdit, showLimits = true }: { canEdit: boolean; showLimits?: boolean }) {
  const [academicYearId, setAcademicYearId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useSupervisionLoadOverview(academicYearId);
  const { academicYears } = useAcademicYears({ pageSize: 50 });
  const setGeneral = useSetGeneralLimits();
  const setPeriod = useSetPeriodLimits();
  const clearPeriod = useClearPeriodLimits();
  const saving = setGeneral.isPending || setPeriod.isPending || clearPeriod.isPending;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.lecturers ?? [])
      .filter((row) => !term || `${row.fullName ?? ''} ${row.scienceGroup?.name ?? ''}`.toLowerCase().includes(term))
      .sort((a, b) => b.activeCount - a.activeCount || (a.fullName ?? '').localeCompare(b.fullName ?? ''));
  }, [data, search]);

  if (isLoading && !data) return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
  if (error || !data) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat batas bimbingan.'}</p>;

  const periodId = data.academicYear?.id;
  const counts = { full: rows.filter((r) => r.level === 'full').length, near: rows.filter((r) => r.level === 'near_limit').length };

  return (
    <div className="space-y-4">
      {showLimits && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batas Bimbingan</CardTitle>
            <CardDescription>
              Batas yang berlaku untuk {data.academicYear?.label ?? 'periode ini'}: {data.applicable.softLimit} (lunak) dan {data.applicable.hardLimit} (keras),
              dari {SOURCE_LABELS[data.applicable.source]}. Melewati batas lunak hanya peringatan; dosen yang sudah mencapai batas keras
              tetap bisa menerima mahasiswa sebagai Pengajuan di Atas Kuota yang diputuskan Ketua Departemen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <LimitsForm
              title="Batas umum"
              description="Berlaku di semua periode yang tidak punya batas sendiri."
              value={data.general}
              disabled={!canEdit}
              saving={saving}
              onSave={(limits) => setGeneral.mutate(limits)}
            />
            <div className="space-y-2">
              <Select value={periodId ?? ''} onValueChange={(value) => setAcademicYearId(value)}>
                <SelectTrigger aria-label="Periode"><SelectValue placeholder="Pilih periode" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.semester === 'genap' ? 'Genap' : 'Ganjil'} {String(year.year)}{year.isActive ? ' (Berjalan)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <LimitsForm
                title={`Batas periode ${data.academicYear?.label ?? ''}`}
                description="Menimpa batas umum untuk satu semester. Kosongkan (Hapus) agar kembali ke batas umum."
                value={data.period}
                disabled={!canEdit || !periodId}
                saving={saving}
                onSave={(limits) => periodId && setPeriod.mutate({ academicYearId: periodId, limits })}
                onClear={() => periodId && clearPeriod.mutate(periodId)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-base">Beban Dosen</CardTitle>
            <CardDescription>
              Semua relasi pembimbing aktif pada TA yang belum selesai, fase apa pun, termasuk mahasiswa yang diterima tetapi belum
              ditetapkan. {counts.full} dosen {getSupervisionLoadLevelLabel('full').toLowerCase()}, {counts.near} dosen {getSupervisionLoadLevelLabel('near_limit').toLowerCase()}.
            </CardDescription>
          </div>
          <SearchField value={search} onChange={setSearch} placeholder="Cari nama dosen atau KBK..." />
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Tidak ada dosen yang cocok." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Dosen</TableHead>
                  <TableHead className="w-40">Beban</TableHead>
                  <TableHead className="w-28 text-center">Menunggu Penetapan</TableHead>
                  <TableHead className="w-24 text-center">Proposal</TableHead>
                  <TableHead className="w-24 text-center">Penelitian</TableHead>
                  <TableHead className="w-16 text-center">BSS</TableHead>
                  <TableHead className="w-28 text-center">Sebagai Pembimbing 2</TableHead>
                  <TableHead className="w-36">Pengajuan Baru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.lecturerId}>
                    <TableCell>
                      <p className="truncate font-medium" title={row.fullName ?? ''}>{formatLecturerName(row.fullName)}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.scienceGroup?.name ?? 'KBK belum diisi'}</p>
                    </TableCell>
                    <TableCell><SupervisionLoadBadge activeCount={row.activeCount} hardLimit={data.applicable.hardLimit} level={row.level} /></TableCell>
                    <TableCell className="text-center">{row.breakdown.waitingAssignment}</TableCell>
                    <TableCell className="text-center">{row.breakdown.proposal}</TableCell>
                    <TableCell className="text-center">{row.breakdown.research}</TableCell>
                    <TableCell className="text-center">{row.breakdown.onLeave}</TableCell>
                    <TableCell className="text-center">{row.breakdown.asSupervisor2}</TableCell>
                    <TableCell>
                      {row.acceptingRequests ? <Badge variant="success">Diterima</Badge> : <Badge variant="outline">Ditutup dosen</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
