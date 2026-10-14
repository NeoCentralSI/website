import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Loader2, PlayCircle } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { formatAttendance, PartyScoreCell, ResultCell } from '@/components/research-method/AssessmentCells';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { ThesisStatusBadge } from '@/components/shared/ThesisStatusBadge';
import { SearchField } from '@/components/shared/SearchField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClassMonitoring, usePromotionPreview, useRunPromotion } from '@/hooks/research-method/useResearchMethod';
import { useRole } from '@/hooks/shared/useRole';
import { downloadAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateShortId, formatLecturerName } from '@/lib/text';
import { getPromotionDecisionLabel, getPromotionDecisionVariant } from '@/lib/thesisLabels';
import { passedTitlesUrl, scoreRecapUrl } from '@/services/research-method/research-method.service';

/**
 * Metode Penelitian > Monitoring Kelas: semua mahasiswa kelas periode itu dan sejauh mana
 * prosesnya, ekspor, dan proses kelulusan (naik ke Penelitian, K13) untuk koordinator dan Kadep.
 */
export default function ClassMonitoring() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isResearchMethodCoordinator, isKadep, isAdmin } = useRole();
  const canPromote = isResearchMethodCoordinator() || isKadep() || isAdmin();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useClassMonitoring(academicYearId);
  const promotion = usePromotionPreview(canPromote);
  const run = useRunPromotion();
  const yearId = academicYearId ?? data?.academicYear.id ?? null;

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Monitoring Kelas' }]);
    setTitle('Monitoring Kelas');
  }, [setBreadcrumbs, setTitle]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (data?.rows ?? []).filter((r) => !needle || `${r.fullName} ${r.identityNumber} ${r.thesis?.title ?? ''}`.toLowerCase().includes(needle));
  }, [data, search]);
  const promotable = (promotion.data?.rows ?? []).filter((r) => r.decision === 'promote').length;
  const runReason = !canPromote ? 'Proses kelulusan dijalankan koordinator, Ketua Departemen, atau Admin.' : promotable === 0 ? 'Belum ada mahasiswa yang memenuhi syarat naik ke Penelitian.' : null;

  const s = data?.summary;
  const tiles = s
    ? [
        ['Peserta', s.total], ['Punya pembimbing', s.withSupervisor], ['Ditetapkan', s.assigned], ['Proposal final', s.finalProposal],
        ['Nilai final', s.finalized], ['Lulus', s.passed], ['Tidak lulus', s.failed], ['Naik ke Penelitian', s.promoted],
      ]
    : [];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Monitoring Kelas {data?.academicYear.label}</CardTitle>
            <CardDescription>Mahasiswa yang mengambil Metode Penelitian menurut SIA atau punya penilaian proposal pada periode ini. Nilai minimum lulus {data?.minimumScore ?? '-'}.</CardDescription>
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
        <CardContent className="space-y-4">
          {tiles.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
              {tiles.map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <SearchField value={search} onChange={setSearch} placeholder="Cari nama, NIM, atau judul" />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
          ) : error || !data ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat monitoring.'}</p>
          ) : rows.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada peserta kelas Metode Penelitian pada periode ini." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[17%]">Mahasiswa</TableHead>
                  <TableHead>Judul dan Pembimbing</TableHead>
                  <TableHead className="w-36">Pengajuan</TableHead>
                  <TableHead className="w-24">Penetapan</TableHead>
                  <TableHead className="w-20">Bimbingan</TableHead>
                  <TableHead className="w-24">Proposal Final</TableHead>
                  <TableHead className="w-20">Presensi</TableHead>
                  <TableHead className="w-24">Nilai P / K</TableHead>
                  <TableHead className="w-32">Nilai Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="whitespace-normal align-top">
                      <div className="font-medium">{row.fullName}</div>
                      <div className="text-xs text-muted-foreground">{row.identityNumber}</div>
                      {row.thesis && <ThesisStatusBadge status={row.thesis.status} className="mt-1" />}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words align-top">
                      <div>{row.thesis?.title || <span className="text-muted-foreground">Belum ada judul</span>}</div>
                      <div className="text-xs text-muted-foreground">
                        {(row.thesis?.supervisors ?? []).map((sv) => `${formatLecturerName(sv.fullName)} (${sv.role ?? '-'})`).join(' · ')}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {row.request ? <SupervisorRequestStatusBadge status={row.request.status} /> : <span className="text-muted-foreground">Belum</span>}
                    </TableCell>
                    <TableCell className="align-top">
                      {row.thesis?.supervisorAssignedAt ? formatDateShortId(row.thesis.supervisorAssignedAt) : <span className="text-muted-foreground">Belum</span>}
                    </TableCell>
                    <TableCell className="align-top">{row.thesis?.proposalGuidances ?? 0} sesi</TableCell>
                    <TableCell className="align-top">
                      {row.assessment?.finalProposalAt ? formatDateShortId(row.assessment.finalProposalAt) : <span className="text-muted-foreground">Belum</span>}
                    </TableCell>
                    <TableCell className={`align-top ${row.attendance && !row.attendance.isEligible ? 'font-medium text-destructive' : ''}`}>
                      {row.attendance ? formatAttendance(row.attendance.attendancePercentage) : '-'}
                    </TableCell>
                    <TableCell className="align-top">
                      <PartyScoreCell score={row.assessment?.supervisorScore} /> / <PartyScoreCell score={row.assessment?.coordinatorScore} />
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {row.assessment ? <ResultCell row={row.assessment} /> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Proses Kelulusan</CardTitle>
            <CardDescription>
              Mahasiswa yang lulus naik ke fase Penelitian setelah SIA menunjukkan KRS Tugas Akhir pada periode setelah Penetapan Pembimbing. Berjalan otomatis setiap enam jam; dapat dijalankan manual.
            </CardDescription>
          </div>
          <span title={runReason ?? undefined}>
            <Button size="sm" disabled={Boolean(runReason) || run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}Jalankan Proses Kelulusan
            </Button>
          </span>
        </CardHeader>
        <CardContent>
          {!canPromote ? (
            <p className="text-sm text-muted-foreground">{runReason}</p>
          ) : promotion.isLoading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
          ) : (promotion.data?.rows ?? []).length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Tidak ada mahasiswa lulus yang masih di fase proposal." />
          ) : (
            <ul className="divide-y rounded-lg border">
              {promotion.data?.rows.map((r) => (
                <li key={r.thesisId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{r.student.fullName}</span>
                    <span className="text-muted-foreground"> · {r.student.identityNumber} · lulus {r.passedIn} ({r.finalScore})</span>
                    <span className="block text-xs text-muted-foreground">{r.reason}</span>
                  </span>
                  <Badge variant={getPromotionDecisionVariant(r.decision)}>{getPromotionDecisionLabel(r.decision)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
