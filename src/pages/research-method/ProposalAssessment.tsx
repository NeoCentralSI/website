import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { AttendanceCell, PartyScoreCell, ResultCell } from '@/components/research-method/AssessmentCells';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { ScoreFormDialog } from '@/components/research-method/ScoreFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { SearchField } from '@/components/shared/SearchField';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCoordinatorQueue } from '@/hooks/research-method/useResearchMethod';
import { useRole } from '@/hooks/shared/useRole';
import { downloadAuthenticatedFileOrToast, openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatLecturerName } from '@/lib/text';
import { passedTitlesUrl, scoreRecapUrl } from '@/services/research-method/research-method.service';
import type { AssessmentView } from '@/types/research-method.types';

/**
 * Metode Penelitian > Penilaian Proposal (koordinator): setiap percobaan periode yang sudah
 * berproposal final, nilai pembimbing dan koordinator, hasil, serta ekspor rekap nilai (format
 * templat SIA) dan daftar judul TA yang lulus.
 */
export default function ProposalAssessment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKoordinatorMetopen } = useRole();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useCoordinatorQueue(academicYearId);
  const [scoring, setScoring] = useState<AssessmentView | null>(null);
  const canScore = isKoordinatorMetopen();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Penilaian Proposal' }]);
    setTitle('Penilaian Proposal');
  }, [setBreadcrumbs, setTitle]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((row) => !needle
      || `${row.student.fullName} ${row.student.identityNumber} ${row.thesis.title}`.toLowerCase().includes(needle));
  }, [data, search]);
  const yearId = academicYearId ?? data?.academicYear.id ?? null;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Penilaian Proposal {data?.academicYear.label}</CardTitle>
            <CardDescription>
              Nilai akhir = nilai pembimbing + nilai koordinator. Lulus bila presensi minimal 75% dan nilai akhir minimal {data?.minimumScore ?? '-'}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <PeriodSelect value={yearId} onChange={setAcademicYearId} />
            <Button variant="outline" size="sm" disabled={!yearId} onClick={() => yearId && downloadAuthenticatedFileOrToast(scoreRecapUrl(yearId), 'Rekap-Nilai-Metode-Penelitian.xlsx')}>
              <Download className="mr-2 h-4 w-4" />Rekap Nilai
            </Button>
            <Button variant="outline" size="sm" disabled={!yearId} onClick={() => yearId && downloadAuthenticatedFileOrToast(passedTitlesUrl(yearId), 'Judul-TA-Lulus-Metode-Penelitian.xlsx')}>
              <Download className="mr-2 h-4 w-4" />Judul TA Lulus
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <SearchField value={search} onChange={setSearch} placeholder="Cari nama, NIM, atau judul" />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
          ) : error || !data ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat data.'}</p>
          ) : rows.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada proposal final pada periode ini." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Mahasiswa</TableHead>
                  <TableHead>Judul dan Pembimbing</TableHead>
                  <TableHead className="w-20">Proposal</TableHead>
                  <TableHead className="w-20">Presensi</TableHead>
                  <TableHead className="w-24">Pembimbing</TableHead>
                  <TableHead className="w-24">Koordinator</TableHead>
                  <TableHead className="w-32">Nilai Akhir</TableHead>
                  <TableHead className="w-32 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const reason = canScore ? row.scoreBlockReason ?? null : 'Hanya Koordinator Metode Penelitian yang mengisi nilai koordinator.';
                  return (
                    <TableRow key={row.id ?? row.thesis.id}>
                      <TableCell className="whitespace-normal align-top">
                        <div className="font-medium">{row.student.fullName}</div>
                        <div className="text-xs text-muted-foreground">{row.student.identityNumber}</div>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words align-top">
                        <div>{row.thesis.title || 'Judul belum ditentukan'}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.thesis.supervisors.map((s) => `${formatLecturerName(s.fullName)} (${s.role ?? '-'})`).join(' · ') || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {row.proposal?.url ? (
                          <Button variant="link" className="h-auto p-0" onClick={() => openAuthenticatedFileOrToast(row.proposal?.url)}>
                            <FileText className="mr-1 h-4 w-4" />Buka
                          </Button>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="align-top"><AttendanceCell row={row} /></TableCell>
                      <TableCell className="align-top"><PartyScoreCell score={row.supervisorScore} /></TableCell>
                      <TableCell className="align-top"><PartyScoreCell score={row.coordinatorScore} /></TableCell>
                      <TableCell className="whitespace-normal align-top"><ResultCell row={row} /></TableCell>
                      <TableCell className="whitespace-normal text-right align-top">
                        <span title={reason ?? undefined}>
                          <Button size="sm" disabled={!canScore || !row.canScore} onClick={() => setScoring(row)}>Nilai</Button>
                        </span>
                        {(!canScore || !row.canScore) && reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ScoreFormDialog row={scoring} party="coordinator" onOpenChange={(open) => !open && setScoring(null)} />
    </div>
  );
}
