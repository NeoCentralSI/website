import { useState } from 'react';
import { Download, Eye, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIssueAssignment, useSupervisorAssignmentOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { downloadAuthenticatedFileOrToast, openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getAssignmentBatchStatusLabel, getAssignmentBatchStatusVariant } from '@/lib/thesisLabels';
import { assignmentPreviewUrl } from '@/services/thesis-proposal/supervisor-assignment.service';
import type { AssignmentBatch, AssignmentOverview } from '@/types/thesis-proposal.types';

/** Why the Head of Department cannot issue now (K14: the button stays, disabled, with this reason). */
export function getIssueBlockReason(overview: AssignmentOverview, canIssue: boolean): string | null {
  if (!canIssue) return 'Hanya Ketua Departemen yang dapat menerbitkan Penetapan Pembimbing.';
  if (overview.entries.length === 0) return 'Belum ada mahasiswa yang pengajuan pembimbingnya disetujui pada periode ini.';
  if (overview.upToDate) return 'Penetapan yang berlaku sudah memuat seluruh mahasiswa di bawah.';
  return null;
}

/** Sekdep downloads only the current batch of a period whose batch is complete (rule kept). */
export function getDownloadBlockReason(batch: AssignmentBatch, overview: AssignmentOverview, isKadepOrAdmin: boolean): string | null {
  if (isKadepOrAdmin) return null;
  if (batch.status !== 'current') return 'Versi ini sudah digantikan.';
  if (!overview.upToDate) return 'Menunggu Ketua Departemen menerbitkan versi terbaru.';
  return null;
}

interface Props {
  /** Kadep issues; Sekdep only reads. */
  canIssue: boolean;
  /** Kadep and Admin may preview and download every version. */
  isKadepOrAdmin: boolean;
}

/**
 * Tab "Penetapan Semester Ini": mahasiswa periode berjalan yang pengajuannya disetujui, status
 * penetapan yang berlaku, dan riwayat versinya. PDF berjudul "Formulir TA-04" menjadi bukti beku.
 */
export function KadepSupervisorAssignmentPanel({ canIssue, isKadepOrAdmin }: Props) {
  const { data, isLoading, error } = useSupervisorAssignmentOverview();
  const issue = useIssueAssignment();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
  if (error || !data) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat Penetapan Pembimbing.'}</p>;

  const blockReason = getIssueBlockReason(data, canIssue);
  const previewReason = data.entries.length === 0 ? 'Belum ada mahasiswa untuk dipratinjau.' : null;
  const current = data.currentBatch;

  let status: { label: string; variant: 'success' | 'warning' | 'outline' };
  if (!current) status = { label: 'Belum Diterbitkan', variant: data.entries.length ? 'warning' : 'outline' };
  else if (data.upToDate) status = { label: `Versi ${current.version} Berlaku`, variant: 'success' };
  else status = { label: `Perlu Diterbitkan Ulang (${data.newCount} baru)`, variant: 'warning' };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Penetapan Pembimbing {data.academicYear.label}
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardTitle>
            <CardDescription>
              Mahasiswa yang pengajuan pembimbingnya disetujui. Setelah diterbitkan, bimbingan proposal dan pengajuan proposal final mahasiswa terbuka.
              {current && ` Terakhir diterbitkan ${formatDateTimeWib(current.generatedAt)}${current.generatedBy?.fullName ? ` oleh ${formatLecturerName(current.generatedBy.fullName)}` : ''}.`}
            </CardDescription>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <div className="flex flex-wrap gap-2 md:justify-end">
              {isKadepOrAdmin && (
                <span title={previewReason ?? undefined}>
                  <Button variant="outline" size="sm" disabled={Boolean(previewReason)} onClick={() => openAuthenticatedFileOrToast(assignmentPreviewUrl(data.academicYear.id))}>
                    <Eye className="mr-2 h-4 w-4" />Pratinjau PDF
                  </Button>
                </span>
              )}
              <span title={blockReason ?? undefined}>
                <Button size="sm" disabled={Boolean(blockReason) || issue.isPending} onClick={() => setConfirm(true)}>
                  {issue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Terbitkan Penetapan
                </Button>
              </span>
            </div>
            {blockReason && canIssue && <p className="max-w-sm text-xs text-muted-foreground md:text-right">{blockReason}</p>}
          </div>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada mahasiswa yang pengajuan pembimbingnya disetujui pada periode ini." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead className="w-[22%]">Mahasiswa</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="w-[26%]">Pembimbing</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry, index) => (
                  <TableRow key={entry.thesisId}>
                    <TableCell className="align-top">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal align-top">
                      <div className="font-medium">{entry.studentName}</div>
                      <div className="text-xs text-muted-foreground">{entry.studentNim}</div>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words align-top">{entry.title}</TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {entry.supervisors.map((supervisor) => (
                        <div key={supervisor.lecturerId}>
                          {formatLecturerName(supervisor.fullName)}
                          {supervisor.role && <span className="text-xs text-muted-foreground"> · {supervisor.role}</span>}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {entry.inCurrentBatch ? <Badge variant="success">Sudah Ditetapkan</Badge> : <Badge variant="warning">Belum Ditetapkan</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Versi</CardTitle>
          <CardDescription>Setiap penerbitan dengan susunan berbeda membuat versi baru; versi sebelumnya disimpan sebagai bukti.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.batches.length === 0 ? (
            <EmptyState size="sm" title="Tidak Ada Data" description="Penetapan Pembimbing periode ini belum pernah diterbitkan." />
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Versi</TableHead>
                  <TableHead>Diterbitkan</TableHead>
                  <TableHead className="w-28">Mahasiswa</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32 text-right">Berkas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batches.map((batch) => {
                  const reason = getDownloadBlockReason(batch, data, isKadepOrAdmin);
                  return (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.version}</TableCell>
                      <TableCell className="whitespace-normal">
                        {formatDateTimeWib(batch.generatedAt)}
                        {batch.generatedBy?.fullName && <div className="text-xs text-muted-foreground">{formatLecturerName(batch.generatedBy.fullName)}</div>}
                      </TableCell>
                      <TableCell>{batch.memberCount}</TableCell>
                      <TableCell><Badge variant={getAssignmentBatchStatusVariant(batch.status)}>{getAssignmentBatchStatusLabel(batch.status)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <span title={reason ?? undefined}>
                          <Button variant="outline" size="sm" disabled={Boolean(reason)} onClick={() => downloadAuthenticatedFileOrToast(batch.fileUrl, batch.fileName)}>
                            <Download className="mr-2 h-4 w-4" />Unduh
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terbitkan Penetapan Pembimbing?</AlertDialogTitle>
            <AlertDialogDescription>
              {current
                ? `Versi ${current.version} digantikan oleh versi ${current.version + 1} yang memuat ${data.entries.length} mahasiswa.`
                : `Penetapan memuat ${data.entries.length} mahasiswa.`}{' '}
              Mahasiswa yang baru ditetapkan menerima notifikasi dan dapat memulai bimbingan proposal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => issue.mutate(data.academicYear.id)}>Terbitkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
