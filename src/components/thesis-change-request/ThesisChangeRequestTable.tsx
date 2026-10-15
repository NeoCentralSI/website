import { useState } from 'react';
import { Eye, Users } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableStatusFilter } from '@/components/shared/TableStatusFilter';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import {
  useChangeRequestInbox,
  useKadepBatchDecision,
  useKadepDecision,
  useLecturerDecision,
} from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { DateTimeCell, STICKY_ACTION_COLUMN_CLASS, TruncatedText } from '@/lib/guidanceCells';
import { formatLecturerName, toTitleCaseName } from '@/lib/text';
import { getChangeRequestStepLabel } from '@/lib/thesisLabels';
import type { ChangeRequestScope, ThesisChangeRequest } from '@/types/thesis-change-request.types';
import { ThesisChangeRequestDecisionDialog, type ChangeDecisionDialogState } from './ThesisChangeRequestDecisionDialog';
import {
  SupervisorLoadNote,
  ThesisChangeRequestMeta,
  ThesisChangeRequestStatusBadge,
  ThesisChangeRequestSteps,
  ThesisChangeRequestSummary,
  ThesisChangeRequestTypeBadge,
} from './ThesisChangeRequestParts';
import { summarizeChange } from './thesisChangeRequestGroups';

/** A batch of "Alihkan Mahasiswa" is one lecturer's students: one page holds it. */
const BATCH_PAGE_SIZE = 100;

const SCOPE_OPTIONS: { value: ChangeRequestScope; label: string }[] = [
  { value: 'awaitingMe', label: 'Menunggu Saya' },
  { value: 'inProgress', label: 'Sedang Berjalan' },
  { value: 'history', label: 'Riwayat' },
];

const EMPTY_TEXT: Record<ChangeRequestScope, string> = {
  awaitingMe: 'Tidak ada pengajuan yang menunggu keputusan Anda.',
  inProgress: 'Tidak ada pengajuan lain yang sedang berjalan.',
  history: 'Belum ada pengajuan yang ditutup.',
};

/** Fixed widths except the summary, so the table fits 1366 px without a horizontal scroll. */
const TABLE_CLASS = 'table-fixed min-w-[960px]';

const lecturerStepsDone = (request: ThesisChangeRequest) => request.currentStep === 'kadep';
const studentName = (request: ThesisChangeRequest) => toTitleCaseName(request.student?.name) || 'mahasiswa';

type DialogTarget =
  | { kind: 'lecturer'; request: ThesisChangeRequest; state: ChangeDecisionDialogState }
  | { kind: 'kadep'; request: ThesisChangeRequest; state: ChangeDecisionDialogState }
  | { kind: 'batch'; batchId: string; state: ChangeDecisionDialogState };

export interface ThesisChangeRequestTableProps {
  /** Ketua Departemen: its own decision, "Putuskan Langsung" and the batch modal. */
  isKadep: boolean;
}

/**
 * Tugas Akhir > Perubahan (Paket E4, 4.2): one table for every role, the content by role.
 * Status filter Menunggu Saya (default), Sedang Berjalan, Riwayat; search by name or NIM.
 * Lanjutan Paket E4: the server filters, searches and pages (no row limit); the old rows stay,
 * slightly dimmed, while the next page loads. Setujui / Tolak on the rows waiting for the
 * viewer; the Ketua Departemen may also decide directly, and decides an "Alihkan Mahasiswa"
 * batch together from its group modal.
 */
export function ThesisChangeRequestTable({ isKadep }: ThesisChangeRequestTableProps) {
  const [scope, setScope] = useState<ChangeRequestScope>('awaitingMe');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const inbox = useChangeRequestInbox({ scope, search: debouncedSearch || undefined, page, pageSize });
  const lecturerDecision = useLecturerDecision();
  const kadepDecision = useKadepDecision();
  const batchDecision = useKadepBatchDecision();

  const [detail, setDetail] = useState<ThesisChangeRequest | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogTarget | null>(null);

  const batch = useChangeRequestInbox({ batchId: groupId ?? undefined, pageSize: BATCH_PAGE_SIZE }, !!groupId);
  const groupRequests = groupId ? batch.data?.data ?? [] : [];
  const counts = inbox.data?.counts;

  const isLoading = inbox.isLoading;
  const isFetching = inbox.isFetching;
  const refetch = () => void inbox.refetch();

  const decideAsLecturer = (request: ThesisChangeRequest, approve: boolean) =>
    setDialog({
      kind: 'lecturer',
      request,
      state: approve
        ? { approve: true, title: 'Setujui pengajuan?', description: `Pengajuan perubahan untuk ${studentName(request)} dilanjutkan ke langkah berikutnya.` }
        : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${studentName(request)} ditutup dan tidak diteruskan.` },
    });

  const decideAsKadep = (request: ThesisChangeRequest, approve: boolean) => {
    const direct = !lecturerStepsDone(request);
    setDialog({
      kind: 'kadep',
      request,
      state: approve
        ? {
          approve: true,
          title: 'Setujui pengajuan?',
          description: `Perubahan untuk ${studentName(request)} langsung diterapkan ke tugas akhirnya.`,
          notesRequired: direct,
          notesHint: direct ? 'Langkah dosen belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${studentName(request)} ditutup tanpa perubahan.` },
    });
  };

  const decideBatch = (batchId: string, requests: ThesisChangeRequest[], approve: boolean) => {
    const direct = requests.some((request) => !lecturerStepsDone(request));
    setDialog({
      kind: 'batch',
      batchId,
      state: approve
        ? {
          approve: true,
          title: `Setujui ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini disetujui dan langsung diterapkan.',
          notesRequired: direct,
          notesHint: direct ? 'Ada langkah dosen yang belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : {
          approve: false,
          title: `Tolak ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini ditolak dengan alasan yang sama.',
        },
    });
  };

  /** Row actions: the viewer's lecturer step, else the Ketua Departemen's decision. */
  const rowDecision = (request: ThesisChangeRequest) => {
    if (request.status !== 'pending') return null;
    if (request.viewer.canDecideAsLecturer) return 'lecturer' as const;
    if (isKadep && request.batchId) return 'batch' as const;
    if (isKadep && lecturerStepsDone(request)) return 'kadep' as const;
    if (isKadep) return 'direct' as const;
    return null;
  };

  const columns: Column<ThesisChangeRequest>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 170,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={toTitleCaseName(row.student?.name)}>{toTitleCaseName(row.student?.name) || '-'}</p>
          <p className="text-xs text-muted-foreground">{row.student?.identityNumber ?? '-'}</p>
        </div>
      ),
    },
    { key: 'kind', header: 'Jenis', width: 110, render: (row) => <ThesisChangeRequestTypeBadge request={row} /> },
    {
      key: 'summary',
      header: 'Ringkasan Perubahan',
      render: (row) => <TruncatedText text={summarizeChange(row, formatLecturerName)} className="max-w-full" />,
    },
    {
      key: 'step',
      header: 'Langkah Berjalan',
      width: 120,
      render: (row) => <span className="text-sm">{row.currentStep ? getChangeRequestStepLabel(row.currentStep) : '-'}</span>,
    },
    { key: 'createdAt', header: 'Tanggal', width: 115, render: (row) => <DateTimeCell date={row.createdAt} /> },
    { key: 'status', header: 'Status', width: 115, render: (row) => <ThesisChangeRequestStatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Aksi',
      width: 230,
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => {
        const decision = rowDecision(row);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {decision === 'lecturer' && (
              <>
                <Button size="sm" variant="outline" className="px-2.5" onClick={() => decideAsLecturer(row, false)}>Tolak</Button>
                <Button size="sm" className="px-2.5" onClick={() => decideAsLecturer(row, true)}>Setujui</Button>
              </>
            )}
            {decision === 'kadep' && (
              <>
                <Button size="sm" variant="outline" className="px-2.5" onClick={() => decideAsKadep(row, false)}>Tolak</Button>
                <Button size="sm" className="px-2.5" onClick={() => decideAsKadep(row, true)}>Setujui</Button>
              </>
            )}
            {decision === 'direct' && (
              <Button size="sm" variant="outline" className="px-2.5" onClick={() => setDetail(row)}>Putuskan Langsung</Button>
            )}
            {decision === 'batch' && (
              <Button size="sm" variant="outline" className="gap-1 px-2.5" onClick={() => setGroupId(row.batchId)}>
                <Users className="h-4 w-4" />
                Kelompok
              </Button>
            )}
            <Button size="sm" variant="ghost" className="gap-1 px-2" onClick={() => setDetail(row)}>
              <Eye className="h-4 w-4" />
              Detail
            </Button>
          </div>
        );
      },
    },
  ];

  const detailKadepCanDecide = !!detail && isKadep && detail.status === 'pending';
  const isSubmitting = lecturerDecision.isPending || kadepDecision.isPending || batchDecision.isPending;
  const closeAll = () => {
    setDialog(null);
    setDetail(null);
    setGroupId(null);
  };

  return (
    <>
      <CustomTable
        columns={columns}
        data={inbox.data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        tableClassName={TABLE_CLASS}
        total={inbox.data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau NIM..."
        emptyText={debouncedSearch ? 'Tidak ditemukan' : EMPTY_TEXT[scope]}
        rowKey={(row) => row.id}
        actions={
          <div className="flex items-center gap-2">
            <TableStatusFilter
              value={scope}
              onChange={(value) => { setScope(value); setPage(1); }}
              options={SCOPE_OPTIONS.map((option) =>
                option.value === 'history' || !counts ? option : { ...option, label: `${option.label} (${counts[option.value]})` },
              )}
              label="Filter status pengajuan"
            />
            <RefreshButton onClick={refetch} isRefreshing={isFetching && !isLoading} />
          </div>
        }
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Pengajuan Perubahan"
        description={detail ? `${toTitleCaseName(detail.student?.name) || '-'} · ${detail.student?.identityNumber ?? '-'}` : undefined}
        footer={detail && (detail.viewer.canDecideAsLecturer || detailKadepCanDecide) ? (
          <>
            {detail.viewer.canDecideAsLecturer ? (
              <>
                <span className="mr-auto text-xs text-muted-foreground">
                  Anda menyetujui sebagai {detail.currentStep ? getChangeRequestStepLabel(detail.currentStep) : '-'}.
                </span>
                <Button size="sm" variant="outline" onClick={() => decideAsLecturer(detail, false)}>Tolak</Button>
                <Button size="sm" onClick={() => decideAsLecturer(detail, true)}>Setujui</Button>
              </>
            ) : (
              <>
                {!lecturerStepsDone(detail) && (
                  <span className="mr-auto text-xs text-amber-700">
                    Langkah dosen belum selesai. Anda tetap dapat memutuskan langsung dengan alasan.
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={() => decideAsKadep(detail, false)}>Tolak</Button>
                <Button size="sm" onClick={() => decideAsKadep(detail, true)}>Setujui</Button>
              </>
            )}
          </>
        ) : undefined}
      >
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ThesisChangeRequestTypeBadge request={detail} />
              <ThesisChangeRequestStatusBadge status={detail.status} />
            </div>
            {detail.thesisTitle && (
              <p className="text-sm [overflow-wrap:anywhere]">
                <span className="text-muted-foreground">Judul tugas akhir: </span>
                {detail.thesisTitle}
              </p>
            )}
            <ThesisChangeRequestSummary request={detail} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Langkah persetujuan</p>
              <ThesisChangeRequestSteps request={detail} />
            </div>
            {detail.supervisor && (
              <SupervisorLoadNote load={detail.newSupervisorLoad} name={isKadep ? detail.supervisor.next?.name : 'Anda'} />
            )}
            <ThesisChangeRequestMeta request={detail} />
          </>
        )}
      </RecordDetailDialog>

      <RecordDetailDialog
        open={!!groupId}
        onOpenChange={(open) => { if (!open) setGroupId(null); }}
        title="Kelompok Alihkan Mahasiswa"
        description={groupRequests.length > 0
          ? `${groupRequests.length} mahasiswa · ${formatLecturerName(groupRequests[0].supervisor?.replaced?.name) || '-'} → ${formatLecturerName(groupRequests[0].supervisor?.next?.name) || '-'}`
          : undefined}
        footer={groupId && isKadep && groupRequests.length > 0 ? (
          <>
            <Button size="sm" variant="outline" onClick={() => decideBatch(groupId, groupRequests, false)}>Tolak Semua</Button>
            <Button size="sm" onClick={() => decideBatch(groupId, groupRequests, true)}>Setujui Semua</Button>
          </>
        ) : undefined}
      >
        <ul className="divide-y rounded-md border">
          {groupRequests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{toTitleCaseName(request.student?.name) || '-'}</p>
                <p className="text-xs text-muted-foreground">
                  {request.student?.identityNumber ?? '-'} · Langkah: {request.currentStep ? getChangeRequestStepLabel(request.currentStep) : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThesisChangeRequestStatusBadge status={request.status} />
                <Button size="sm" variant="ghost" className="px-2" onClick={() => setDetail(request)}>Detail</Button>
              </div>
            </li>
          ))}
        </ul>
        {groupRequests[0]?.supervisor && (
          <SupervisorLoadNote load={groupRequests[0].newSupervisorLoad} name={groupRequests[0].supervisor.next?.name} />
        )}
      </RecordDetailDialog>

      <ThesisChangeRequestDecisionDialog
        state={dialog?.state ?? null}
        isSubmitting={isSubmitting}
        onClose={() => setDialog(null)}
        onSubmit={({ approve, notes }) => {
          if (!dialog) return;
          const done = { onSuccess: closeAll };
          if (dialog.kind === 'lecturer') lecturerDecision.mutate({ requestId: dialog.request.id, approve, notes }, done);
          else if (dialog.kind === 'kadep') kadepDecision.mutate({ requestId: dialog.request.id, approve, notes }, done);
          else batchDecision.mutate({ batchId: dialog.batchId, approve, notes }, done);
        }}
      />
    </>
  );
}
