import { StudentThesisSeminarStatusCard } from './StudentThesisSeminarStatusCard';
import { StudentThesisSeminarIdentityCard } from './StudentThesisSeminarIdentityCard';
import { StudentThesisSeminarChecklistRequirementsCard } from './StudentThesisSeminarChecklistRequirementsCard';
import { StudentThesisSeminarDocumentCard } from './StudentThesisSeminarDocumentCard';
import { ThesisEventHistoryTable } from '@/components/shared/ThesisEventHistoryTable';
import type { SeminarHistoryItem, SeminarOverviewResponse } from '@/types/seminar.types';

interface OverviewPanelProps {
  overview: SeminarOverviewResponse;
  history: SeminarHistoryItem[];
  onDetailClick: (seminarId: string) => void;
}

export const StudentThesisSeminarOverviewPanel = ({
  overview,
  history,
  onDetailClick,
}: OverviewPanelProps) => {
  const seminarStatus = overview.seminar?.status ?? null;
  const historyItems = history.filter((item) => item.id !== overview.seminar?.id);

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Full-width identity card */}
      {overview.seminar ? (
        <StudentThesisSeminarIdentityCard
          seminar={overview.seminar}
          onClick={() => onDetailClick(overview.seminar!.id)}
        />
      ) : null}

      {/* Two-column: roadmap left | checklist + documents right */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[14px] items-start">
        {/* Left: vertical roadmap — stretch to match right column height */}
        <div className="self-stretch">
          <StudentThesisSeminarStatusCard
            status={seminarStatus}
            milestones={overview.milestones}
          />
        </div>

        {/* Right: stacked cards */}
        <div className="flex flex-col gap-[14px]">
          <StudentThesisSeminarChecklistRequirementsCard checklist={overview.checklist} />
          <StudentThesisSeminarDocumentCard
            requirements={overview.requirements}
            canUpload={overview.canUpload}
            configuration={overview.requirementConfiguration}
            uploadConfig={overview.uploadConfig}
          />
        </div>
      </div>

      {historyItems.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-card">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Riwayat Percobaan</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Seminar yang tidak lulus atau dibatalkan sebelumnya
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {historyItems.length} Percobaan
            </span>
          </div>

          <ThesisEventHistoryTable items={historyItems} onDetail={onDetailClick} />
        </section>
      ) : null}
    </div>
  );
};
