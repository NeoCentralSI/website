import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { FileText } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { AttendanceCell, PartyScoreCell, ResultCell } from '@/components/research-method/AssessmentCells';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { ScoreFormDialog } from '@/components/research-method/ScoreFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupervisorQueue } from '@/hooks/research-method/useResearchMethod';
import { openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateShortId } from '@/lib/text';
import type { AssessmentView } from '@/types/research-method.types';

/**
 * Tugas Akhir > Proposal (dosen pembimbing, rencana bagian 6): mahasiswa bimbingan fase proposal,
 * proposal final per percobaan, presensi, dan aksi "Nilai Proposal". Pembimbing 1 normalnya
 * mengisi; Pembimbing 2 boleh mengisi sebagai cadangan (K9). Nilai terkunci setelah dikirim.
 */
export default function LecturerThesisProposal() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const { data, isLoading, error } = useSupervisorQueue(academicYearId);
  const [scoring, setScoring] = useState<AssessmentView | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir' }, { label: 'Proposal' }]);
    setTitle('Proposal');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Mahasiswa Fase Proposal</CardTitle>
            <CardDescription>
              Nilai proposal setelah mahasiswa mengajukan proposal final dan presensi kelas Metode Penelitian tersedia.
              {data && ` Nilai minimum lulus ${data.academicYear.label}: ${data.minimumScore}.`}
            </CardDescription>
          </div>
          <PeriodSelect value={academicYearId ?? data?.academicYear.id} onChange={setAcademicYearId} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
          ) : error || !data ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat data.'}</p>
          ) : data.rows.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada mahasiswa bimbingan fase proposal pada periode ini." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Mahasiswa</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="w-28">Proposal Final</TableHead>
                  <TableHead className="w-20">Presensi</TableHead>
                  <TableHead className="w-24">Pembimbing</TableHead>
                  <TableHead className="w-24">Koordinator</TableHead>
                  <TableHead className="w-32">Nilai Akhir</TableHead>
                  <TableHead className="w-36 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.id ?? row.thesis.id}>
                    <TableCell className="whitespace-normal align-top">
                      <Link to={`/tugas-akhir/bimbingan/lecturer/my-students/${row.thesis.id}`} className="font-medium hover:underline">
                        {row.student.fullName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{row.student.identityNumber}</div>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words align-top">{row.thesis.title || 'Judul belum ditentukan'}</TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {row.proposal?.url ? (
                        <Button variant="link" className="h-auto p-0" onClick={() => openAuthenticatedFileOrToast(row.proposal?.url)}>
                          <FileText className="mr-1 h-4 w-4" />Buka
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Belum</span>
                      )}
                      {row.proposal?.submittedAt && <div className="text-xs text-muted-foreground">{formatDateShortId(row.proposal.submittedAt)}</div>}
                    </TableCell>
                    <TableCell className="align-top"><AttendanceCell row={row} /></TableCell>
                    <TableCell className="align-top"><PartyScoreCell score={row.supervisorScore} /></TableCell>
                    <TableCell className="align-top"><PartyScoreCell score={row.coordinatorScore} /></TableCell>
                    <TableCell className="whitespace-normal align-top"><ResultCell row={row} /></TableCell>
                    <TableCell className="whitespace-normal text-right align-top">
                      <span title={row.scoreBlockReason ?? undefined}>
                        <Button size="sm" disabled={!row.canScore} onClick={() => setScoring(row)}>Nilai Proposal</Button>
                      </span>
                      {!row.canScore && row.scoreBlockReason && <p className="mt-1 text-xs text-muted-foreground">{row.scoreBlockReason}</p>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ScoreFormDialog row={scoring} party="supervisor" onOpenChange={(open) => !open && setScoring(null)} />
    </div>
  );
}
