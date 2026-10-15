import { useState } from 'react';
import { ClipboardCheck, Eye } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableStatusFilter } from '@/components/shared/TableStatusFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { useEvaluationContext, useEvaluationInbox } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { DateTimeCell, STICKY_ACTION_COLUMN_CLASS } from '@/lib/guidanceCells';
import { toTitleCaseName } from '@/lib/text';
import {
  GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS,
  getGuidanceEvaluationRecommendationLabel,
  getGuidanceEvaluationStageLabel,
} from '@/lib/thesisLabels';
import type { EvaluationRow, EvaluationScope } from '@/types/thesis-guidance-evaluation.types';
import { LecturerThesisGuidanceEvaluationFormDialog } from './LecturerThesisGuidanceEvaluationFormDialog';
import { ThesisGuidanceEvaluationDecisionDialog, type EvaluationDecisionState } from './ThesisGuidanceEvaluationDecisionDialog';
import { ThesisGuidanceEvaluationStatusBadge, ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

const SCOPE_OPTIONS: { value: EvaluationScope; label: string }[] = [
  { value: 'action', label: 'Perlu Tindakan' },
  { value: 'kadep', label: 'Menunggu Kadep' },
  { value: 'history', label: 'Riwayat' },
];

const EMPTY_TEXT: Record<EvaluationScope, string> = {
  action: 'Tidak ada evaluasi yang perlu Anda tindak lanjuti.',
  kadep: 'Tidak ada evaluasi yang menunggu keputusan Ketua Departemen.',
  history: 'Belum ada riwayat evaluasi.',
};

const TABLE_CLASS = 'table-fixed min-w-[960px]';

/** Loads the thesis context and opens the existing "Isi Evaluasi" form. */
function EvaluationFormLauncher({ thesisId, onClose }: { thesisId: string; onClose: () => void }) {
  const { data: context, isLoading } = useEvaluationContext(thesisId);
  if (isLoading || !context) {
    return (
      <RecordDetailDialog open onOpenChange={(open) => { if (!open) onClose(); }} title="Isi Evaluasi">
        <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
      </RecordDetailDialog>
    );
  }
  return <LecturerThesisGuidanceEvaluationFormDialog open onOpenChange={(open) => { if (!open) onClose(); }} context={context} />;
}

const studentOf = (row: EvaluationRow) => (row.kind === 'due' ? row.due.thesis.student : row.evaluation.student);
const thesisTitleOf = (row: EvaluationRow) => (row.kind === 'due' ? row.due.thesis.title : row.evaluation.thesisTitle);

export interface ThesisGuidanceEvaluationTableProps {
  /** Ketua Departemen: Setujui / Tolak; "Menunggu Kadep" is hidden (it repeats "Perlu Tindakan"). */
  isKadep: boolean;
}

/**
 * Tugas Akhir > Evaluasi (Paket E4, 4.3): due and filled guidance evaluations in one table.
 * "Isi Evaluasi" opens the existing form for Pembimbing 1; the Ketua Departemen approves or
 * rejects. Replaces the evaluation part of "Persetujuan Tugas Akhir" (4.4). Lanjutan Paket E4:
 * the server filters, searches and pages (no row limit).
 */
export function ThesisGuidanceEvaluationTable({ isKadep }: ThesisGuidanceEvaluationTableProps) {
  const [scope, setScope] = useState<EvaluationScope>('action');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const inbox = useEvaluationInbox({ scope, search: debouncedSearch, page, pageSize });
  const [detail, setDetail] = useState<EvaluationRow | null>(null);
  const [formThesisId, setFormThesisId] = useState<string | null>(null);
  const [decision, setDecision] = useState<EvaluationDecisionState>(null);

  const counts = inbox.data?.counts;
  // Lanjutan Paket E4 (4): for the Ketua Departemen "Menunggu Kadep" equals "Perlu Tindakan".
  const scopeOptions = SCOPE_OPTIONS.filter((option) => !(isKadep && option.value === 'kadep'));
  const isLoading = inbox.isLoading;
  const isFetching = inbox.isFetching;
  const refetch = () => void inbox.refetch();

  const kadepCanDecide = (row: EvaluationRow) => isKadep && row.kind === 'evaluation' && row.evaluation.status === 'pending';

  const columns: Column<EvaluationRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={toTitleCaseName(studentOf(row)?.name)}>{toTitleCaseName(studentOf(row)?.name) || '-'}</p>
          <p className="text-xs text-muted-foreground">{studentOf(row)?.identityNumber ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'supervision',
      header: 'Masa Bimbingan',
      width: 140,
      render: (row) => {
        const days = row.kind === 'due' ? row.due.supervision.elapsedDays : row.evaluation.basis.elapsedDays;
        const label = row.kind === 'due' ? row.due.supervision.elapsedLabel : null;
        return <span className="text-sm">{label || (days === null ? '-' : `${days} hari`)}</span>;
      },
    },
    {
      key: 'stage',
      header: 'Tahap',
      width: 150,
      render: (row) => <span className="text-sm">{getGuidanceEvaluationStageLabel(row.kind === 'due' ? row.due.stage : row.evaluation.stage)}</span>,
    },
    {
      key: 'recommendation',
      header: 'Keputusan Pembimbing',
      width: 150,
      render: (row) =>
        row.kind === 'due'
          ? <span className="text-sm text-muted-foreground">Belum diisi</span>
          : <span className="text-sm">{getGuidanceEvaluationRecommendationLabel(row.evaluation.recommendation)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (row) => (row.kind === 'due' ? <Badge variant="warning">Jatuh Tempo</Badge> : <ThesisGuidanceEvaluationStatusBadge evaluation={row.evaluation} />),
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 115,
      render: (row) => (row.kind === 'due' ? <span className="text-muted-foreground">-</span> : <DateTimeCell date={row.evaluation.createdAt} />),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 200,
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.kind === 'due' && row.due.viewerRole === 'pembimbing_1' && (
            <span title={row.due.blockReason ?? undefined}>
              <Button size="sm" className="gap-1 px-2.5" disabled={!row.due.canSubmit} onClick={() => setFormThesisId(row.due.thesis.id)}>
                <ClipboardCheck className="h-4 w-4" />
                Isi Evaluasi
              </Button>
            </span>
          )}
          {kadepCanDecide(row) && row.kind === 'evaluation' && (
            <>
              <Button size="sm" variant="outline" className="px-2.5" onClick={() => setDecision({ evaluation: row.evaluation, approve: false })}>Tolak</Button>
              <Button size="sm" className="px-2.5" onClick={() => setDecision({ evaluation: row.evaluation, approve: true })}>Setujui</Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="gap-1 px-2" onClick={() => setDetail(row)}>
            <Eye className="h-4 w-4" />
            Detail
          </Button>
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
              options={scopeOptions.map((option) =>
                option.value === 'history' || !counts ? option : { ...option, label: `${option.label} (${counts[option.value]})` },
              )}
              label="Filter status evaluasi"
            />
            <RefreshButton onClick={refetch} isRefreshing={isFetching && !isLoading} />
          </div>
        }
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Evaluasi Bimbingan"
        description={detail ? `${toTitleCaseName(studentOf(detail)?.name) || '-'} · ${studentOf(detail)?.identityNumber ?? '-'}` : undefined}
        footer={detail && kadepCanDecide(detail) && detail.kind === 'evaluation' ? (
          <>
            <span className="mr-auto text-xs text-muted-foreground">{GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[detail.evaluation.recommendation]}</span>
            <Button size="sm" variant="outline" onClick={() => setDecision({ evaluation: detail.evaluation, approve: false })}>Tolak</Button>
            <Button size="sm" onClick={() => setDecision({ evaluation: detail.evaluation, approve: true })}>Setujui</Button>
          </>
        ) : undefined}
      >
        {detail && (
          <>
            <p className="text-sm [overflow-wrap:anywhere]">
              <span className="text-muted-foreground">Judul tugas akhir: </span>
              {thesisTitleOf(detail) || '(belum ada judul)'}
            </p>
            {detail.kind === 'evaluation' ? (
              <ThesisGuidanceEvaluationSummary evaluation={detail.evaluation} />
            ) : (
              <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
                <dt className="text-muted-foreground">Tahap</dt>
                <dd>{getGuidanceEvaluationStageLabel(detail.due.stage)}</dd>
                <dt className="text-muted-foreground">Masa bimbingan</dt>
                <dd>{detail.due.supervision.elapsedLabel || '-'}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>Jatuh tempo, belum diisi Pembimbing 1</dd>
                {detail.due.blockReason && (
                  <>
                    <dt className="text-muted-foreground">Keterangan</dt>
                    <dd className="[overflow-wrap:anywhere]">{detail.due.blockReason}</dd>
                  </>
                )}
              </dl>
            )}
          </>
        )}
      </RecordDetailDialog>

      {formThesisId && <EvaluationFormLauncher thesisId={formThesisId} onClose={() => setFormThesisId(null)} />}

      <ThesisGuidanceEvaluationDecisionDialog state={decision} onClose={() => setDecision(null)} onDone={() => setDetail(null)} />
    </>
  );
}
