import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PeriodSelect } from '@/components/research-method/PeriodSelect';
import { PageHeading } from '@/components/shared/PageHeading';
import { AssignmentVersionHistoryTable, KadepAssignmentBoardTable } from '@/components/thesis-proposal/KadepAssignmentBoard';
import { PAST_SEMESTER_LIMIT_REASON, SupervisionLimitToolbar } from '@/components/thesis-proposal/SupervisionLimitControls';
import { SupervisionLoadTable } from '@/components/thesis-proposal/SupervisionLoadTable';
import { Spinner } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';
import { useAssignmentBoard } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { useSupervisionLoadOverview } from '@/hooks/thesis-proposal/useSupervisionQuota';

const TABS = [
  { value: 'penetapan', label: 'Penetapan' },
  { value: 'riwayat-versi', label: 'Riwayat Versi' },
  { value: 'beban-dosen', label: 'Beban Dosen' },
] as const;
type TabValue = (typeof TABS)[number]['value'];
const DEFAULT_TAB: TabValue = 'penetapan';

function Loading() {
  return <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>;
}

/**
 * Tugas Akhir > Penetapan (Paket P9, 5): one semester for the whole page (default the running
 * one; a past semester is read only), three panels. Ketua Departemen decides and issues;
 * Sekretaris Departemen reads (and, as K30, may set the semester's limits in Beban Dosen).
 */
export default function KadepThesisSupervisorAssignment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep, isSekdep, isAdmin } = useRole();
  const kadep = isKadep();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: TabValue = TABS.some((t) => t.value === requestedTab) ? (requestedTab as TabValue) : DEFAULT_TAB;
  const semesterId = searchParams.get('semester') || undefined;
  const board = useAssignmentBoard(semesterId);
  const loads = useSupervisionLoadOverview(semesterId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir' }, { label: 'Penetapan Pembimbing' }]);
    setTitle('Penetapan Pembimbing');
  }, [setBreadcrumbs, setTitle]);

  const update = (next: { tab?: TabValue; semester?: string }) => {
    const params: Record<string, string> = {};
    const nextTab = next.tab ?? tab;
    const nextSemester = next.semester ?? semesterId;
    if (nextTab !== DEFAULT_TAB) params.tab = nextTab;
    if (nextSemester) params.semester = nextSemester;
    setSearchParams(params, { replace: true });
  };

  const data = board.data;
  const isOperational = data?.academicYear.isOperational ?? true;

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Penetapan Pembimbing" subtitle="Keputusan pengajuan pembimbing dan penerbitan penetapan per semester">
        <PeriodSelect value={semesterId ?? data?.academicYear.id} onChange={(id) => update({ semester: id })} />
      </PageHeading>
      <LocalTabsNav
        tabs={TABS.map((t) => ({ value: t.value, label: t.label, badge: t.value === 'penetapan' && kadep && data?.counts.waiting ? data.counts.waiting : undefined }))}
        activeTab={tab}
        onTabChange={(value) => update({ tab: value as TabValue })}
      />

      {tab !== 'beban-dosen' && (board.isLoading && !data ? <Loading /> : board.error || !data ? (
        <p className="text-sm text-destructive">{board.error instanceof Error ? board.error.message : 'Gagal memuat Penetapan Pembimbing.'}</p>
      ) : tab === 'penetapan' ? (
        <KadepAssignmentBoardTable
          board={data}
          isFetching={board.isFetching}
          onRefresh={() => void board.refetch()}
          isKadep={kadep}
          isKadepOrAdmin={kadep || isAdmin()}
        />
      ) : (
        <AssignmentVersionHistoryTable board={data} isKadepOrAdmin={kadep || isAdmin()} />
      ))}

      {tab === 'beban-dosen' && (loads.isLoading && !loads.data ? <Loading /> : loads.error || !loads.data ? (
        <p className="text-sm text-destructive">{loads.error instanceof Error ? loads.error.message : 'Gagal memuat beban dosen.'}</p>
      ) : (
        <SupervisionLoadTable
          overview={loads.data}
          isFetching={loads.isFetching}
          toolbar={(
            <SupervisionLimitToolbar
              overview={loads.data}
              scope="period"
              canEdit={kadep || isSekdep()}
              disabledReason={isOperational ? null : PAST_SEMESTER_LIMIT_REASON}
            />
          )}
        />
      ))}
    </div>
  );
}
