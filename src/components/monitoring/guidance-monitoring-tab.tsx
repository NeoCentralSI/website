import type { ReactNode } from "react";
import { Loading } from "@/components/ui/spinner";
import { useMonitoringDashboard } from "@/hooks/monitoring/useMonitoring";
import { ActivityDistributionChart } from "./ActivityDistributionChart";
import { BatchDistributionChart } from "./BatchDistributionChart";
import { EvaluationDueCard } from "./EvaluationDueCard";
import { MonitoringSummaryCards } from "./MonitoringSummaryCards";
import { GuidanceTrendChart } from "./MonthlyTrendChart";
import { ProgressDistributionChart } from "./ProgressDistributionChart";
import { SlowStudentsCard } from "./SlowStudentsCard";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { SupervisorLoadCard } from "./SupervisorLoadCard";
import { ThesesTable } from "./ThesesTable";
import { TopicDistributionChart } from "./TopicDistributionChart";

interface GuidanceMonitoringTabProps {
  /** `academicYear` of the monitoring endpoints; undefined for every semester. */
  academicYear?: string;
  /** False while the semester filter is still being resolved. */
  enabled: boolean;
  /** The page-wide reload is running. */
  isSyncing?: boolean;
  /** Initial activity filter of the table, e.g. from `?activity=`. */
  initialActivity?: string;
  /** The page's semester select, in the table toolbar. */
  semesterSelect?: ReactNode;
  /** Page actions in the table toolbar (the report download). */
  extraActions?: ReactNode;
  /** Muat Ulang of the whole page. */
  onRefresh?: () => void;
}

/**
 * Bimbingan tab of the monitoring page: the theses that run in the semester, their activity
 * and evaluations, and the supervisors' load.
 */
export function GuidanceMonitoringTab({ academicYear, enabled, isSyncing = false, initialActivity, semesterSelect, extraActions, onRefresh }: GuidanceMonitoringTabProps) {
  const { data, isLoading, isFetching } = useMonitoringDashboard(academicYear, { enabled });
  const isLoadingAny = isLoading || isFetching || isSyncing;

  // Full blank loading on browser reload (no cached data), and while the default semester is resolved
  if (!enabled || (isLoading && !data)) {
    return (
      <div className="flex h-[calc(100vh-320px)] items-center justify-center">
        <Loading size="lg" text="Memuat data monitoring..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MonitoringSummaryCards summary={data?.summary} isLoading={isLoadingAny} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatusDistributionChart statusDistribution={data?.statusDistribution} isLoading={isLoadingAny} />
        <ActivityDistributionChart activityDistribution={data?.activityDistribution} isLoading={isLoadingAny} />
        <ProgressDistributionChart progressDistribution={data?.progressDistribution} isLoading={isLoadingAny} />
        <TopicDistributionChart topicDistribution={data?.topicDistribution} isLoading={isLoadingAny} />
        <BatchDistributionChart batchDistribution={data?.batchDistribution} isLoading={isLoadingAny} />
        <GuidanceTrendChart guidanceTrend={data?.guidanceTrend} isLoading={isLoadingAny} />
      </div>

      {/* Quick lists: two columns on a wide screen, one on a narrow one */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EvaluationDueCard students={data?.evaluationDueStudents} isLoading={isLoadingAny} />
        <SlowStudentsCard slowStudents={data?.slowStudents} atRiskStudents={data?.atRiskStudents} isLoading={isLoadingAny} />
        <div className="min-w-0 lg:col-span-2">
          <SupervisorLoadCard loads={data?.supervisorLoads} isLoading={isLoadingAny} />
        </div>
      </div>

      <ThesesTable
        isSyncing={isSyncing}
        academicYear={academicYear}
        initialActivity={initialActivity}
        semesterSelect={semesterSelect}
        extraActions={extraActions}
        onRefresh={onRefresh}
      />
    </div>
  );
}
