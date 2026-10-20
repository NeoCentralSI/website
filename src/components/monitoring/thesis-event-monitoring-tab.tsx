import EmptyState from "@/components/ui/empty-state";
import { useThesisEventMonitoring } from "@/hooks/monitoring/useMonitoring";
import { useRole } from "@/hooks/shared/useRole";
import type { ThesisEventKind } from "@/services/monitoring.service";
import { EventAttentionCard } from "./event-attention-card";
import { ReadyToRegisterCard } from "./ready-to-register-card";
import { THESIS_EVENT_COPY } from "./thesis-event-copy";
import { ThesisEventSummaryCards } from "./thesis-event-summary-cards";
import { ThesisEventsTable } from "./thesis-events-table";
import { UpcomingEventsCard } from "./upcoming-events-card";

interface ThesisEventMonitoringTabProps {
  kind: ThesisEventKind;
  /** `academicYear` of the monitoring endpoints; undefined for every semester. */
  academicYear?: string;
  /** False while the semester filter is still being resolved. */
  enabled: boolean;
}

/**
 * Seminar Hasil / Sidang tab of the monitoring page (read-only): summary cards, students
 * ready to register, the coming schedule, what needs attention, and the table.
 */
export function ThesisEventMonitoringTab({ kind, academicYear, enabled }: ThesisEventMonitoringTabProps) {
  const { data, isLoading, isFetching, isError, error, refetch } = useThesisEventMonitoring(kind, academicYear, { enabled });
  // The seminar and defence detail pages are open to admin and every lecturer role.
  const { isAdmin, isDosen } = useRole();
  const canOpenDetail = isAdmin() || isDosen();
  const loading = !enabled || isLoading;

  if (isError) {
    return (
      <EmptyState
        title="Gagal Memuat Data"
        description={error?.message || THESIS_EVENT_COPY[kind].loadError}
        showButton
        buttonText="Coba Lagi"
        onButtonClick={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ThesisEventSummaryCards kind={kind} summary={data?.summary} isLoading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReadyToRegisterCard kind={kind} students={data?.readyToRegister} isLoading={loading} />
        <UpcomingEventsCard kind={kind} events={data?.upcoming} total={data?.upcomingTotal} isLoading={loading} />
        <div className="min-w-0 lg:col-span-2">
          <EventAttentionCard kind={kind} events={data?.attention} isLoading={loading} />
        </div>
      </div>

      <ThesisEventsTable
        kind={kind}
        events={data?.items}
        isLoading={loading}
        canOpenDetail={canOpenDetail}
        onRefresh={() => void refetch()}
        isFetching={isFetching && !loading}
      />
    </div>
  );
}
