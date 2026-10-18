import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, PlayCircle } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { formatAttendance } from '@/components/research-method/AssessmentCells';
import { ExportButtons } from '@/components/research-method/ExportButtons';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { PageHeading, SectionHeading } from '@/components/shared/PageHeading';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useClassMonitoring, usePromotionPreview, useRunPromotion } from '@/hooks/research-method/useResearchMethod';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useRole } from '@/hooks/shared/useRole';
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
import { formatDateShortId, formatLecturerName } from '@/lib/text';
import {
  getPromotionDecisionLabel,
  getPromotionDecisionVariant,
  getSupervisorRequestStatusLabel,
  PROMOTION_DECISION_LABELS,
  type PromotionDecision,
} from '@/lib/thesisLabels';
import type { MonitoringRow, PromotionRow } from '@/types/research-method.types';

/** Fixed columns 728 px; the title narrows. No horizontal scroll at 1366 px. */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

const STAGE_OPTIONS = [
  { label: 'Semua', value: '' },
  ...RESEARCH_METHOD_STAGE_ORDER.map((value) => ({ label: RESEARCH_METHOD_STAGE_LABELS[value], value })),
];

/** "Proses Kelulusan": who is promoted first. */
const DECISION_ORDER: PromotionDecision[] = ['promote', 'wait_sia', 'wait_thesis_course', 'wait_next_period'];
const DECISION_OPTIONS = [
  { label: 'Semua', value: '' },
  ...DECISION_ORDER.map((value) => ({ label: PROMOTION_DECISION_LABELS[value], value })),
];

/** The line under the stage badge: the step's date or count. */
function stageDetail(row: MonitoringRow, stage: ResearchMethodStage): string {
  switch (stage) {
    case 'assessing':
    case 'failed':
    case 'passed':
    case 'promoted':
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

/**
 * Metode Penelitian > Monitoring Kelas (Paket P8): semua mahasiswa kelas periode itu dan sejauh
 * mana prosesnya, ekspor, dan proses kelulusan (naik ke Penelitian, K13). Bawaan "Semua",
 * diurutkan dari tahap yang paling butuh perhatian; Tahap disaring di kepala kolom.
 */
export default function ClassMonitoring() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isResearchMethodCoordinator, isKadep, isAdmin } = useRole();
  const canPromote = isResearchMethodCoordinator() || isKadep() || isAdmin();
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [stage, setStage] = useState<ResearchMethodStage | ''>('');
  const [decision, setDecision] = useState<PromotionDecision | ''>('');
  const monitoring = useClassMonitoring(academicYearId);
  const promotion = usePromotionPreview(canPromote);
  const run = useRunPromotion();
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

  const promotionRows = useMemo(() => {
    const rank = (row: PromotionRow) => DECISION_ORDER.indexOf(row.decision);
    const sorted = [...(promotion.data?.rows ?? [])].sort((a, b) => rank(a) - rank(b));
    return decision ? sorted.filter((row) => row.decision === decision) : sorted;
  }, [promotion.data, decision]);
  const promotionTable = useLocalTable(promotionRows, (row, term) => haystack(row.student.fullName, row.student.identityNumber).includes(term));

  const promotable = (promotion.data?.rows ?? []).filter((r) => r.decision === 'promote').length;
  const runReason = !canPromote
    ? 'Proses kelulusan dijalankan koordinator, Ketua Departemen, atau Admin.'
    : promotable === 0 ? 'Belum ada mahasiswa yang memenuhi syarat naik ke Penelitian.' : null;

  const s = data?.summary;
  const tiles: [string, number][] = s
    ? [
        ['Peserta', s.total], ['Punya Pembimbing', s.withSupervisor], ['Ditetapkan', s.assigned], ['Proposal Final', s.finalProposal],
        ['Nilai Final', s.finalized], ['Lulus', s.passed], ['Tidak Lulus', s.failed], ['Naik ke Penelitian', s.promoted],
      ]
    : [];

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
        const detail = stageDetail(row, value);
        return (
          <div className="min-w-0 space-y-0.5">
            <Badge variant={RESEARCH_METHOD_STAGE_VARIANTS[value]} className="whitespace-nowrap">{RESEARCH_METHOD_STAGE_LABELS[value]}</Badge>
            {detail && <p className="truncate text-xs text-muted-foreground" title={detail}>{detail}</p>}
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
      key: 'attendance',
      header: 'Presensi',
      width: 100,
      className: CLIP_CELL,
      render: (row) => (
        <span className={row.attendance && !row.attendance.isEligible ? 'font-medium text-destructive' : undefined}>
          {row.attendance ? formatAttendance(row.attendance.attendancePercentage) : '-'}
        </span>
      ),
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
  ];

  const promotionColumns: Column<PromotionRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 220,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell name={row.student.fullName ?? ''} nim={row.student.identityNumber ?? ''} />,
    },
    {
      key: 'passed',
      header: 'Lulus Metode Penelitian',
      width: 200,
      className: CLIP_CELL,
      render: (row) => <span className="whitespace-nowrap">{row.passedIn ?? '-'} · nilai {row.finalScore ?? '-'}</span>,
    },
    {
      key: 'decision',
      header: 'Keputusan',
      width: BADGE_COLUMN_WIDTH.promotionDecision,
      className: CLIP_CELL,
      render: (row) => <Badge variant={getPromotionDecisionVariant(row.decision)} className="whitespace-nowrap">{getPromotionDecisionLabel(row.decision)}</Badge>,
      filter: {
        type: 'select',
        value: decision,
        onChange: (value) => { setDecision(value as PromotionDecision | ''); promotionTable.resetPage(); },
        options: DECISION_OPTIONS,
      },
    },
    { key: 'reason', header: 'Keterangan', className: CLIP_CELL, render: (row) => <TruncatedText text={row.error ?? row.reason} className="max-w-full" /> },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <PageHeading title="Monitoring Kelas" subtitle="Kemajuan mahasiswa kelas Metode Penelitian, dari pengajuan pembimbing sampai nilai akhir" />
        {data && (
          <p className="text-sm text-muted-foreground">
            Peserta {data.academicYear.label}: mahasiswa yang mengambil Metode Penelitian menurut SIA atau punya penilaian proposal pada periode ini. Nilai minimum lulus {data.minimumScore}.
          </p>
        )}
      </div>

      {tiles.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {tiles.map(([label, value]) => (
            <Card key={label} className="gap-1 p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-semibold">{value}</dd>
            </Card>
          ))}
        </dl>
      )}

      {monitoring.error ? (
        <p className="text-sm text-destructive">{monitoring.error instanceof Error ? monitoring.error.message : 'Gagal memuat monitoring.'}</p>
      ) : (
        <CustomTable
          columns={columns}
          {...table.tableProps}
          loading={monitoring.isLoading}
          isRefreshing={monitoring.isFetching && !monitoring.isLoading}
          subtleRefresh
          enableColumnFilters
          tableClassName={TABLE_CLASS}
          searchPlaceholder="Cari nama, NIM, atau judul..."
          emptyText={table.search || stage ? 'Tidak ditemukan' : 'Belum ada peserta kelas Metode Penelitian pada periode ini.'}
          rowKey={(row) => row.studentId}
          actions={
            <>
              <PeriodSelect value={yearId} onChange={setAcademicYearId} />
              <ExportButtons academicYearId={yearId} />
              <RefreshButton onClick={() => void monitoring.refetch()} isRefreshing={monitoring.isFetching && !monitoring.isLoading} />
            </>
          }
        />
      )}

      <div className="space-y-3">
        <SectionHeading
          title="Proses Kelulusan"
          description="Mahasiswa lulus naik ke fase Penelitian setelah SIA menunjukkan KRS Tugas Akhir pada periode setelah Penetapan Pembimbing. Berjalan otomatis setiap enam jam dan dapat dijalankan manual."
        >
          <span title={runReason ?? undefined} className="inline-flex">
            <Button size="sm" disabled={Boolean(runReason) || run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}Jalankan Proses Kelulusan
            </Button>
          </span>
        </SectionHeading>
        {runReason && <p className="text-xs text-muted-foreground">{runReason}</p>}
        {canPromote && (
          <CustomTable
            columns={promotionColumns}
            {...promotionTable.tableProps}
            loading={promotion.isLoading}
            isRefreshing={promotion.isFetching && !promotion.isLoading}
            subtleRefresh
            enableColumnFilters
            tableClassName="table-fixed"
            searchPlaceholder="Cari nama atau NIM..."
            emptyText={promotionTable.search || decision ? 'Tidak ditemukan' : 'Tidak ada mahasiswa lulus yang masih di fase proposal.'}
            rowKey={(row) => row.thesisId}
          />
        )}
      </div>
    </div>
  );
}
