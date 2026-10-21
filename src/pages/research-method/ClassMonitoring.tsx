import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { ResultCell } from '@/components/research-method/AssessmentCells';
import { ClassMonitoringCharts } from '@/components/research-method/ClassMonitoringCharts';
import { ExportButtons } from '@/components/research-method/ExportButtons';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { PageHeading } from '@/components/shared/PageHeading';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useClassMonitoring } from '@/hooks/research-method/useResearchMethod';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { TruncatedText } from '@/lib/guidanceCells';
import {
  RESEARCH_METHOD_STAGE_LABELS,
  RESEARCH_METHOD_STAGE_ORDER,
  RESEARCH_METHOD_STAGE_VARIANTS,
  researchMethodStage,
  scoreSum,
  type ResearchMethodStage,
} from '@/lib/researchMethodViews';
import { BADGE_COLUMN_WIDTH, CLIP_CELL } from '@/lib/tableColumnWidths';
import { formatDateShortId, formatLecturerName, toTitleCaseName } from '@/lib/text';
import { getSupervisorRequestStatusLabel, getThesisStatusLabel } from '@/lib/thesisLabels';
import type { MonitoringRow } from '@/types/research-method.types';

/** Fixed columns 798 px; the title narrows. No horizontal scroll at 1366 px. */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

const STAGE_OPTIONS = [
  { label: 'Semua', value: '' },
  ...RESEARCH_METHOD_STAGE_ORDER.map((value) => ({ label: RESEARCH_METHOD_STAGE_LABELS[value], value })),
];

/** The line under the stage badge: the step's date or count. */
function stageDetail(row: MonitoringRow, stage: ResearchMethodStage): string {
  switch (stage) {
    case 'assessing':
    case 'failed':
    case 'research':
      return row.assessment?.finalProposalAt ? `Proposal final ${formatDateShortId(row.assessment.finalProposalAt)}` : '';
    case 'guidance':
      return row.thesis?.supervisorAssignedAt ? `Ditetapkan ${formatDateShortId(row.thesis.supervisorAssignedAt)}` : '';
    case 'requesting':
    case 'waiting_assignment':
      return row.request ? getSupervisorRequestStatusLabel(row.request.status) : '';
    default:
      return '';
  }
}

function supervisorsOf(row: MonitoringRow) {
  return (row.thesis?.supervisors ?? []).map((sv) => `${formatLecturerName(sv.fullName)} (${sv.role ?? '-'})`).join(' · ');
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function partyScore(score: number | null | undefined, name: string | null | undefined) {
  if (score == null) return <span className="text-muted-foreground">Belum dikirim</span>;
  return (
    <>
      <span className="font-medium">{score}</span>
      {name && <span className="text-muted-foreground"> · {formatLecturerName(name)}</span>}
    </>
  );
}

/**
 * Metode Penelitian > Monitoring Kelas: every student of the class in the semester, how far each
 * one is in the proposal flow, and the scores. One panel: the two charts, then one table. "Semua"
 * puts the stages that need attention first; Tahap is filtered in its header; the eye opens both
 * scores. A pass starts the research phase at once, so the last stage is "Mulai Penelitian".
 */
export default function ClassMonitoring() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [stage, setStage] = useState<ResearchMethodStage | ''>('');
  const [detail, setDetail] = useState<MonitoringRow | null>(null);
  const monitoring = useClassMonitoring(academicYearId);
  const data = monitoring.data;
  const yearId = academicYearId ?? data?.academicYear.id ?? null;

  useEffect(() => {
    setBreadcrumbs([{ label: 'Metode Penelitian' }, { label: 'Monitoring Kelas' }]);
    setTitle('Monitoring Kelas');
  }, [setBreadcrumbs, setTitle]);

  const rows = useMemo(() => {
    const rank = (row: MonitoringRow) => RESEARCH_METHOD_STAGE_ORDER.indexOf(researchMethodStage(row));
    const sorted = [...(data?.rows ?? [])].sort((a, b) => rank(a) - rank(b) || String(a.identityNumber).localeCompare(String(b.identityNumber)));
    return stage ? sorted.filter((row) => researchMethodStage(row) === stage) : sorted;
  }, [data, stage]);
  const table = useLocalTable(rows, (row, term) => haystack(row.fullName, row.identityNumber, row.thesis?.title).includes(term));
  const refreshing = monitoring.isFetching && !monitoring.isLoading;

  const columns: Column<MonitoringRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 190,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell name={row.fullName ?? ''} nim={row.identityNumber ?? ''} />,
    },
    {
      key: 'title',
      header: 'Judul dan Pembimbing',
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <TruncatedText text={row.thesis?.title || 'Belum ada judul'} className="max-w-full" />
          <p className="truncate text-xs text-muted-foreground" title={supervisorsOf(row)}>{supervisorsOf(row) || 'Belum ada pembimbing'}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Tahap',
      width: BADGE_COLUMN_WIDTH.researchMethodStage,
      className: CLIP_CELL,
      render: (row) => {
        const value = researchMethodStage(row);
        const line = stageDetail(row, value);
        return (
          <div className="min-w-0 space-y-0.5">
            <Badge variant={RESEARCH_METHOD_STAGE_VARIANTS[value]} className="whitespace-nowrap">{RESEARCH_METHOD_STAGE_LABELS[value]}</Badge>
            {line && <p className="truncate text-xs text-muted-foreground" title={line}>{line}</p>}
          </div>
        );
      },
      filter: {
        type: 'select',
        value: stage,
        onChange: (value) => { setStage(value as ResearchMethodStage | ''); table.resetPage(); },
        options: STAGE_OPTIONS,
      },
    },
    {
      key: 'guidance',
      header: 'Bimbingan',
      width: 110,
      className: CLIP_CELL,
      render: (row) => <span className="whitespace-nowrap">{row.thesis?.proposalGuidances ?? 0} sesi</span>,
    },
    {
      key: 'score',
      header: 'Nilai',
      width: 140,
      className: CLIP_CELL,
      render: (row) => {
        const a = row.assessment;
        return (
          <span className="whitespace-nowrap" title={a ? `Pembimbing ${a.supervisorScore ?? '-'} + Koordinator ${a.coordinatorScore ?? '-'}` : undefined}>
            {a ? scoreSum(a.supervisorScore, a.coordinatorScore, a.isFinalized ? a.finalScore : null) : '-'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      className: 'text-center',
      render: (row) => (
        <div className="flex justify-center">
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
        </div>
      ),
    },
  ];

  const a = detail?.assessment ?? null;

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Monitoring Kelas" subtitle="Kemajuan mahasiswa kelas Metode Penelitian" />

      <ClassMonitoringCharts summary={data?.summary} isLoading={monitoring.isLoading} />

      {monitoring.error ? (
        <p className="text-sm text-destructive">{monitoring.error instanceof Error ? monitoring.error.message : 'Gagal memuat monitoring.'}</p>
      ) : (
        <CustomTable
          columns={columns}
          {...table.tableProps}
          loading={monitoring.isLoading}
          isRefreshing={refreshing}
          subtleRefresh
          enableColumnFilters
          tableClassName={TABLE_CLASS}
          searchPlaceholder="Cari nama, NIM, atau judul..."
          emptyText={table.search || stage ? 'Tidak ditemukan' : 'Belum ada peserta kelas Metode Penelitian pada semester ini.'}
          rowKey={(row) => row.studentId}
          actions={
            <>
              {data && <Badge variant="outline" className="h-8 whitespace-nowrap px-3 text-sm font-medium">Nilai minimum: {data.minimumScore}</Badge>}
              <PeriodSelect value={yearId} onChange={setAcademicYearId} />
              <ExportButtons academicYearId={yearId} />
              <RefreshButton onClick={() => void monitoring.refetch()} isRefreshing={refreshing} />
            </>
          }
        />
      )}

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Peserta Kelas"
        description={detail ? `${toTitleCaseName(detail.fullName) || '-'} · ${detail.identityNumber ?? '-'}` : undefined}
        footer={detail ? <DetailDialogActions onClose={() => setDetail(null)} /> : undefined}
      >
        {detail && (
          <dl className="space-y-2">
            <DetailRow label="Judul">{detail.thesis?.title || 'Belum ada judul'}</DetailRow>
            <DetailRow label="Pembimbing">{supervisorsOf(detail) || 'Belum ada pembimbing'}</DetailRow>
            <DetailRow label="Status tugas akhir">{detail.thesis ? getThesisStatusLabel(detail.thesis.status) : '-'}</DetailRow>
            <DetailRow label="Tahap">{RESEARCH_METHOD_STAGE_LABELS[researchMethodStage(detail)]}</DetailRow>
            <DetailRow label="Bimbingan proposal">{detail.thesis?.proposalGuidances ?? 0} sesi selesai</DetailRow>
            <DetailRow label="Proposal final">
              {a?.finalProposalAt ? formatDateShortId(a.finalProposalAt) : <span className="text-muted-foreground">Belum diajukan</span>}
            </DetailRow>
            <DetailRow label="Nilai pembimbing">{partyScore(a?.supervisorScore, a?.supervisorName)}</DetailRow>
            <DetailRow label="Nilai koordinator">{partyScore(a?.coordinatorScore, a?.coordinatorName)}</DetailRow>
            <DetailRow label="Nilai akhir">
              {a ? <ResultCell row={a} /> : <span className="text-muted-foreground">Belum final</span>}
            </DetailRow>
            {data && <DetailRow label="Nilai minimum lulus">{data.minimumScore} ({data.academicYear.label})</DetailRow>}
          </dl>
        )}
      </RecordDetailDialog>
    </div>
  );
}
