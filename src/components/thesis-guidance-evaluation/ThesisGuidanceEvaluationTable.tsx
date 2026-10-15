import { useMemo, useState } from 'react';
import { ClipboardCheck, Eye } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableStatusFilter } from '@/components/shared/TableStatusFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { useClientTable } from '@/hooks/shared/useClientTable';
import {
  useDepartmentEvaluations,
  useEvaluationContext,
  useSupervisorEvaluations,
} from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { DateTimeCell, STICKY_ACTION_COLUMN_CLASS } from '@/lib/guidanceCells';
import { toTitleCaseName } from '@/lib/text';
import {
  GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS,
  getGuidanceEvaluationRecommendationLabel,
  getGuidanceEvaluationStageLabel,
} from '@/lib/thesisLabels';
import type { SupervisorEvaluationDue, ThesisGuidanceEvaluation } from '@/types/thesis-guidance-evaluation.types';
import { LecturerThesisGuidanceEvaluationFormDialog } from './LecturerThesisGuidanceEvaluationFormDialog';
import { ThesisGuidanceEvaluationDecisionDialog, type EvaluationDecisionState } from './ThesisGuidanceEvaluationDecisionDialog';
import { ThesisGuidanceEvaluationStatusBadge, ThesisGuidanceEvaluationSummary } from './ThesisGuidanceEvaluationParts';

export type EvaluationScope = 'action' | 'kadep' | 'history';

/** A due evaluation not filled yet, or a filled evaluation. */
export type EvaluationRow =
  | { kind: 'due'; id: string; due: SupervisorEvaluationDue }
  | { kind: 'evaluation'; id: string; evaluation: ThesisGuidanceEvaluation };

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

/** The department lists are read whole (the server caps a page at 100) and filtered here. */
const DEPARTMENT_PAGE = { search: '', page: 1, pageSize: 100 } as const;
const TABLE_CLASS = 'table-fixed min-w-[960px]';

function uniqueEvaluations(evaluations: ThesisGuidanceEvaluation[]): ThesisGuidanceEvaluation[] {
  const seen = new Set<string>();
  return evaluations.filter((evaluation) => (seen.has(evaluation.id) ? false : (seen.add(evaluation.id), true)));
}

/**
 * Paket E4 (4.3): rows per status filter. "Perlu Tindakan" is, for a supervisor, a due thesis
 * not filled by Pembimbing 1 yet and, for the Ketua Departemen, an evaluation waiting for his
 * decision; "Menunggu Kadep" the filled ones waiting for the department; "Riwayat" the rest.
 */
export function splitEvaluationRows(input: {
  supervisor?: { due: SupervisorEvaluationDue[]; evaluations: ThesisGuidanceEvaluation[] } | null;
  departmentPending?: ThesisGuidanceEvaluation[] | null;
  departmentHistory?: ThesisGuidanceEvaluation[] | null;
}): Record<EvaluationScope, EvaluationRow[]> {
  const asRow = (evaluation: ThesisGuidanceEvaluation): EvaluationRow => ({ kind: 'evaluation', id: evaluation.id, evaluation });
  const departmentPending = input.departmentPending ?? [];
  const own = input.supervisor?.evaluations ?? [];
  const due: EvaluationRow[] = (input.supervisor?.due ?? []).map((item) => ({ kind: 'due', id: `due-${item.thesis.id}`, due: item }));
  const pending = uniqueEvaluations([...departmentPending, ...own.filter((evaluation) => evaluation.status === 'pending')]);
  const history = uniqueEvaluations([...(input.departmentHistory ?? []), ...own.filter((evaluation) => evaluation.status !== 'pending')]);
  return {
    action: [...due, ...departmentPending.map(asRow)],
    kadep: pending.map(asRow),
    history: history.map(asRow),
  };
}

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
  isSupervisor: boolean;
  isKadep: boolean;
}

/**
 * Tugas Akhir > Evaluasi (Paket E4, 4.3): due and filled guidance evaluations in one table.
 * "Isi Evaluasi" opens the existing form for Pembimbing 1; the Ketua Departemen approves or
 * rejects. Replaces the evaluation part of "Persetujuan Tugas Akhir" (4.4).
 */
export function ThesisGuidanceEvaluationTable({ isSupervisor, isKadep }: ThesisGuidanceEvaluationTableProps) {
  const supervisor = useSupervisorEvaluations(isSupervisor);
  const departmentPending = useDepartmentEvaluations({ scope: 'pending', ...DEPARTMENT_PAGE }, isKadep);
  const departmentHistory = useDepartmentEvaluations({ scope: 'history', ...DEPARTMENT_PAGE }, isKadep);

  const [scope, setScope] = useState<EvaluationScope>('action');
  const [detail, setDetail] = useState<EvaluationRow | null>(null);
  const [formThesisId, setFormThesisId] = useState<string | null>(null);
  const [decision, setDecision] = useState<EvaluationDecisionState>(null);

  const lists = useMemo(
    () =>
      splitEvaluationRows({
        supervisor: isSupervisor ? supervisor.data : null,
        departmentPending: isKadep ? departmentPending.data?.data : null,
        departmentHistory: isKadep ? departmentHistory.data?.data : null,
      }),
    [isSupervisor, isKadep, supervisor.data, departmentPending.data, departmentHistory.data],
  );
  const table = useClientTable(lists[scope], (row) => [studentOf(row)?.name, studentOf(row)?.identityNumber]);

  const isLoading = (isSupervisor && supervisor.isLoading) || (isKadep && (departmentPending.isLoading || departmentHistory.isLoading));
  const isFetching = supervisor.isFetching || departmentPending.isFetching || departmentHistory.isFetching;
  const refetch = () => {
    if (isSupervisor) void supervisor.refetch();
    if (isKadep) {
      void departmentPending.refetch();
      void departmentHistory.refetch();
    }
  };

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
        data={table.pageRows}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        tableClassName={TABLE_CLASS}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Cari nama atau NIM..."
        emptyText={table.search ? 'Tidak ditemukan' : EMPTY_TEXT[scope]}
        rowKey={(row) => row.id}
        actions={
          <div className="flex items-center gap-2">
            <TableStatusFilter
              value={scope}
              onChange={(value) => { setScope(value); table.resetPage(); }}
              options={SCOPE_OPTIONS.map((option) =>
                option.value === 'history' ? option : { ...option, label: `${option.label} (${lists[option.value].length})` },
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
