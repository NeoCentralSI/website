import { useState } from 'react';
import { Check, Eye, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { useEvaluationInbox } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { DateTimeCell } from '@/lib/guidanceCells';
import { ACTIONS_3_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { toTitleCaseName } from '@/lib/text';
import {
  GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS,
  GUIDANCE_EVALUATION_VIEW_STATUS_LABELS,
  GUIDANCE_EVALUATION_VIEW_STATUS_VARIANTS,
  getGuidanceEvaluationRecommendationLabel,
  getGuidanceEvaluationStageLabel,
  type GuidanceEvaluationViewStatus,
} from '@/lib/thesisLabels';
import type { EvaluationInboxRow } from '@/types/thesis-guidance-evaluation.types';
import { ThesisGuidanceEvaluationDecisionDialog, type EvaluationDecisionState } from './ThesisGuidanceEvaluationDecisionDialog';
import { ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

/** Status filter in the order of `EVALUATION_STATUS_PRIORITY` (backend). */
const STATUS_OPTIONS: { label: string; value: GuidanceEvaluationViewStatus | '' }[] = [
  { label: 'Semua', value: '' },
  ...(['awaiting_decision', 'approved', 'rejected', 'recorded'] as const).map((value) => ({
    label: GUIDANCE_EVALUATION_VIEW_STATUS_LABELS[value],
    value,
  })),
];

/**
 * Fixed widths except "Keputusan Pembimbing" (Paket E6, 1): the badge and date columns fit their
 * longest text and the free-text column narrows instead; the masa bimbingan sits under the
 * stage. Below 1000 px the table scrolls.
 */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

function ClampedText({ text }: { text: string }) {
  return <span className="block whitespace-normal break-words text-sm line-clamp-2" title={text}>{text}</span>;
}

/**
 * Tugas Akhir > Evaluasi (Ketua Departemen, Paket E5, 3.4): every Evaluasi Bimbingan with the
 * department's decision. "Semua" by default, sorted by the server (Menunggu Keputusan Anda
 * first); Status is filtered in the column header, the search matches name or NIM. Supervisors
 * fill evaluations from Mahasiswa Bimbingan and the student detail, not here.
 */
export function ThesisGuidanceEvaluationTable() {
  const [status, setStatus] = useState<GuidanceEvaluationViewStatus | ''>('');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const inbox = useEvaluationInbox({ status: status || undefined, search: debouncedSearch, page, pageSize });
  const [detail, setDetail] = useState<EvaluationInboxRow | null>(null);
  const [decision, setDecision] = useState<EvaluationDecisionState>(null);

  const isLoading = inbox.isLoading;
  const isFetching = inbox.isFetching;
  const awaiting = (row: EvaluationInboxRow) => row.viewStatus === 'awaiting_decision';

  const columns: Column<EvaluationInboxRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 190,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell name={row.student?.name ?? ''} nim={row.student?.identityNumber ?? ''} />,
    },
    {
      // The masa bimbingan sits under the stage instead of a narrow column of its own.
      key: 'stage',
      header: 'Tahap',
      width: 170,
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <ClampedText text={getGuidanceEvaluationStageLabel(row.stage)} />
          <p className="truncate text-xs text-muted-foreground">
            Masa bimbingan {row.basis.elapsedDays === null ? '-' : `${row.basis.elapsedDays} hari`}
          </p>
        </div>
      ),
    },
    {
      key: 'recommendation',
      header: 'Keputusan Pembimbing',
      className: CLIP_CELL,
      render: (row) => <ClampedText text={getGuidanceEvaluationRecommendationLabel(row.recommendation)} />,
    },
    { key: 'date', header: 'Tanggal', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (row) => <DateTimeCell date={row.createdAt} /> },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.decisionStatus,
      className: CLIP_CELL,
      render: (row) => (
        <Badge variant={GUIDANCE_EVALUATION_VIEW_STATUS_VARIANTS[row.viewStatus] ?? 'outline'} className="whitespace-nowrap">
          {GUIDANCE_EVALUATION_VIEW_STATUS_LABELS[row.viewStatus] ?? row.viewStatus}
        </Badge>
      ),
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value as GuidanceEvaluationViewStatus | ''); setPage(1); },
        options: STATUS_OPTIONS,
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: ACTIONS_3_WIDTH,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
          {awaiting(row) && (
            <>
              <TableIconAction icon={Check} label="Setujui" tone="approve" onClick={() => setDecision({ evaluation: row, approve: true })} />
              <TableIconAction icon={X} label="Tolak" onClick={() => setDecision({ evaluation: row, approve: false })} />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <CustomTable
        columns={columns}
        data={inbox.data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        enableColumnFilters
        tableClassName={TABLE_CLASS}
        total={inbox.data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama atau NIM..."
        emptyText={debouncedSearch || status ? 'Tidak ditemukan' : 'Belum ada evaluasi bimbingan.'}
        rowKey={(row) => row.id}
        actions={<RefreshButton onClick={() => void inbox.refetch()} isRefreshing={isFetching && !isLoading} />}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Evaluasi Bimbingan"
        description={detail ? `${toTitleCaseName(detail.student?.name) || '-'} · ${detail.student?.identityNumber ?? '-'}` : undefined}
        footer={detail ? (
          awaiting(detail) ? (
            <DetailDialogActions onClose={() => setDetail(null)} note={GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[detail.recommendation]}>
              <Button size="sm" variant="destructive" onClick={() => setDecision({ evaluation: detail, approve: false })}>Tolak</Button>
              <Button size="sm" onClick={() => setDecision({ evaluation: detail, approve: true })}>Setujui</Button>
            </DetailDialogActions>
          ) : (
            <DetailDialogActions onClose={() => setDetail(null)} />
          )
        ) : undefined}
      >
        {detail && (
          <>
            <p className="text-sm [overflow-wrap:anywhere]">
              <span className="text-muted-foreground">Judul tugas akhir: </span>
              {detail.thesisTitle || '(belum ada judul)'}
            </p>
            <ThesisGuidanceEvaluationSummary evaluation={detail} />
          </>
        )}
      </RecordDetailDialog>

      <ThesisGuidanceEvaluationDecisionDialog state={decision} onClose={() => setDecision(null)} onDone={() => setDetail(null)} />
    </>
  );
}
