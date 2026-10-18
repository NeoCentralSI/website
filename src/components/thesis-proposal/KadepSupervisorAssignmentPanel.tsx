import { useMemo, useState } from 'react';
import { Download, Eye, Loader2 } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { SectionHeading } from '@/components/shared/PageHeading';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
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
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useIssueAssignment, useSupervisorAssignmentOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { downloadAuthenticatedFileOrToast, openAuthenticatedFileOrToast } from '@/lib/authenticatedFile';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getAssignmentBatchStatusLabel, getAssignmentBatchStatusVariant } from '@/lib/thesisLabels';
import { assignmentPreviewUrl } from '@/services/thesis-proposal/supervisor-assignment.service';
import type { AssignmentBatch, AssignmentEntry, AssignmentOverview } from '@/types/thesis-proposal.types';

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

type EntryStatus = 'pending' | 'assigned';
const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = { pending: 'Belum Ditetapkan', assigned: 'Sudah Ditetapkan' };
const entryStatus = (entry: AssignmentEntry): EntryStatus => (entry.inCurrentBatch ? 'assigned' : 'pending');

interface Props {
  /** Kadep issues; Sekdep only reads. */
  canIssue: boolean;
  /** Kadep and Admin may preview and download every version. */
  isKadepOrAdmin: boolean;
}

/**
 * Tab "Penetapan Semester Ini" (Paket P8): a summary card with the status and the two actions,
 * then the cohort and the version history as tables. "Semua" by default, the students not yet in
 * the current version first. PDF berjudul "Formulir TA-04" menjadi bukti beku.
 */
export function KadepSupervisorAssignmentPanel({ canIssue, isKadepOrAdmin }: Props) {
  const { data, isLoading, error } = useSupervisorAssignmentOverview();
  const issue = useIssueAssignment();
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<EntryStatus | ''>('');

  const entries = useMemo(() => {
    const sorted = [...(data?.entries ?? [])].sort((a, b) => Number(a.inCurrentBatch) - Number(b.inCurrentBatch) || a.studentNim.localeCompare(b.studentNim));
    return status ? sorted.filter((entry) => entryStatus(entry) === status) : sorted;
  }, [data, status]);
  const entryTable = useLocalTable(entries, (entry, term) => haystack(entry.studentName, entry.studentNim, entry.title, entry.supervisorNames).includes(term));
  const batchTable = useLocalTable(data?.batches ?? [], (batch, term) => haystack(String(batch.version), batch.generatedBy?.fullName).includes(term), 5);

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
  if (error || !data) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Gagal memuat Penetapan Pembimbing.'}</p>;

  const blockReason = getIssueBlockReason(data, canIssue);
  const previewReason = data.entries.length === 0 ? 'Belum ada mahasiswa untuk dipratinjau.' : null;
  const current = data.currentBatch;

  let summary: { label: string; variant: 'success' | 'warning' | 'outline' };
  if (!current) summary = { label: 'Belum Diterbitkan', variant: data.entries.length ? 'warning' : 'outline' };
  else if (data.upToDate) summary = { label: `Versi ${current.version} Berlaku`, variant: 'success' };
  else summary = { label: `Perlu Diterbitkan Ulang (${data.newCount} baru)`, variant: 'warning' };

  const entryColumns: Column<AssignmentEntry>[] = [
    { key: 'no', header: 'No', width: 56, className: 'text-center', render: (_entry, index) => (entryTable.tableProps.page - 1) * entryTable.tableProps.pageSize + index + 1 },
    { key: 'student', header: 'Mahasiswa', width: 200, className: CLIP_CELL, render: (entry) => <ThesisStudentInfoCell name={entry.studentName} nim={entry.studentNim} /> },
    { key: 'title', header: 'Judul', className: CLIP_CELL, render: (entry) => <TruncatedText text={entry.title} className="max-w-full" /> },
    {
      key: 'supervisors',
      header: 'Pembimbing',
      width: 260,
      className: CLIP_CELL,
      render: (entry) => (
        <div className="min-w-0 space-y-0.5 text-sm">
          {entry.supervisors.map((supervisor) => {
            const line = `${formatLecturerName(supervisor.fullName)}${supervisor.role ? ` · ${supervisor.role}` : ''}`;
            return <p key={supervisor.lecturerId} className="truncate" title={line}>{line}</p>;
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.assignmentEntryStatus,
      className: CLIP_CELL,
      render: (entry) => (
        <Badge variant={entry.inCurrentBatch ? 'success' : 'warning'} className="whitespace-nowrap">{ENTRY_STATUS_LABELS[entryStatus(entry)]}</Badge>
      ),
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value as EntryStatus | ''); entryTable.resetPage(); },
        options: [{ label: 'Semua', value: '' }, { label: ENTRY_STATUS_LABELS.pending, value: 'pending' }, { label: ENTRY_STATUS_LABELS.assigned, value: 'assigned' }],
      },
    },
  ];

  const batchColumns: Column<AssignmentBatch>[] = [
    { key: 'version', header: 'Versi', width: 80, className: 'text-center', render: (batch) => batch.version },
    { key: 'generatedAt', header: 'Diterbitkan', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (batch) => <DateTimeCell date={batch.generatedAt} /> },
    { key: 'by', header: 'Oleh', className: CLIP_CELL, render: (batch) => <TruncatedText text={formatLecturerName(batch.generatedBy?.fullName) || '-'} className="max-w-full" /> },
    { key: 'members', header: 'Mahasiswa', width: 110, className: 'text-center', render: (batch) => batch.memberCount },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.assignmentBatchStatus,
      className: CLIP_CELL,
      render: (batch) => <Badge variant={getAssignmentBatchStatusVariant(batch.status)} className="whitespace-nowrap">{getAssignmentBatchStatusLabel(batch.status)}</Badge>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (batch) => {
        const reason = getDownloadBlockReason(batch, data, isKadepOrAdmin);
        return (
          <div className="flex items-center justify-center">
            <TableIconAction icon={Download} label="Unduh PDF" disabled={Boolean(reason)} disabledReason={reason} onClick={() => downloadAuthenticatedFileOrToast(batch.fileUrl, batch.fileName)} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Penetapan Pembimbing {data.academicYear.label}
              <Badge variant={summary.variant}>{summary.label}</Badge>
            </CardTitle>
            <CardDescription>
              Mahasiswa yang pengajuan pembimbingnya disetujui. Setelah diterbitkan, bimbingan proposal dan pengajuan proposal final mahasiswa terbuka.
              {current && ` Terakhir diterbitkan ${formatDateTimeWib(current.generatedAt)}${current.generatedBy?.fullName ? ` oleh ${formatLecturerName(current.generatedBy.fullName)}` : ''}.`}
            </CardDescription>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            {blockReason && canIssue && <p className="max-w-sm text-xs text-muted-foreground md:text-right">{blockReason}</p>}
            <div className="flex flex-wrap gap-2 md:justify-end">
              {isKadepOrAdmin && (
                <span title={previewReason ?? undefined} className="inline-flex">
                  <Button variant="outline" size="sm" disabled={Boolean(previewReason)} onClick={() => openAuthenticatedFileOrToast(assignmentPreviewUrl(data.academicYear.id))}>
                    <Eye className="mr-2 h-4 w-4" />Pratinjau PDF
                  </Button>
                </span>
              )}
              <span title={blockReason ?? undefined} className="inline-flex">
                <Button size="sm" disabled={Boolean(blockReason) || issue.isPending} onClick={() => setConfirm(true)}>
                  {issue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Terbitkan Penetapan
                </Button>
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        <SectionHeading title="Susunan Mahasiswa" description="Mahasiswa yang belum masuk versi berlaku tampil lebih dulu" />
        <CustomTable
          columns={entryColumns}
          {...entryTable.tableProps}
          enableColumnFilters
          tableClassName="table-fixed min-w-[1000px]"
          searchPlaceholder="Cari nama, NIM, judul, atau pembimbing..."
          emptyText={entryTable.search || status ? 'Tidak ditemukan' : 'Belum ada mahasiswa yang pengajuan pembimbingnya disetujui pada periode ini.'}
          rowKey={(entry) => entry.thesisId}
        />
      </div>

      <div className="space-y-3">
        <SectionHeading title="Riwayat Versi" description="Setiap penerbitan dengan susunan berbeda membuat versi baru; versi sebelumnya disimpan sebagai bukti" />
        <CustomTable
          columns={batchColumns}
          {...batchTable.tableProps}
          tableClassName="table-fixed"
          emptyText="Penetapan Pembimbing periode ini belum pernah diterbitkan."
          rowKey={(batch) => batch.id}
        />
      </div>

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
