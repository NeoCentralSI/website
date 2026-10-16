import { useState } from 'react';
import { Check, Eye, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { useEvaluationInbox } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { DateTimeCell } from '@/lib/guidanceCells';
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

/** Fixed widths except "Keputusan Pembimbing", so the table fits 1366 px with the sidebar open. */
const TABLE_CLASS = 'table-fixed min-w-[960px]';

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
      width: 200,
      render: (row) => <ThesisStudentInfoCell name={row.student?.name ?? ''} nim={row.student?.identityNumber ?? ''} />,
    },
    {
      key: 'stage',
      header: 'Tahap',
      width: 160,
      render: (row) => <ClampedText text={getGuidanceEvaluationStageLabel(row.stage)} />,
    },
    {
      key: 'recommendation',
      header: 'Keputusan Pembimbing',
      render: (row) => <ClampedText text={getGuidanceEvaluationRecommendationLabel(row.recommendation)} />,
    },
    {
      key: 'supervision',
      header: 'Masa Bimbingan',
      width: 120,
      render: (row) => <span className="whitespace-nowrap text-sm">{row.basis.elapsedDays === null ? '-' : `${row.basis.elapsedDays} hari`}</span>,
    },
    { key: 'date', header: 'Tanggal', width: 120, render: (row) => <DateTimeCell date={row.createdAt} /> },
    {
      key: 'status',
      header: 'Status',
      width: 200,
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
      width: 128,
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
        footer={detail && awaiting(detail) ? (
          <>
            <span className="mr-auto text-xs text-muted-foreground">{GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[detail.recommendation]}</span>
            <Button size="sm" variant="outline" onClick={() => setDecision({ evaluation: detail, approve: false })}>Tolak</Button>
            <Button size="sm" onClick={() => setDecision({ evaluation: detail, approve: true })}>Setujui</Button>
          </>
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
