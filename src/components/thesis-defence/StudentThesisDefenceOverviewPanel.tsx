import { StudentThesisDefenceStatusCard } from './StudentThesisDefenceStatusCard';
import { StudentThesisDefenceIdentityCard } from './StudentThesisDefenceIdentityCard';
import { StudentThesisDefenceChecklistRequirementsCard } from './StudentThesisDefenceChecklistRequirementsCard';
import { StudentThesisDefenceDocumentCard } from './StudentThesisDefenceDocumentCard';
import { ThesisEventHistoryTable } from '@/components/shared/ThesisEventHistoryTable';
import type { StudentDefenceHistoryItem, DefenceOverviewResponse } from '@/types/defence.types';

interface OverviewPanelProps {
  overview: DefenceOverviewResponse;
  history: StudentDefenceHistoryItem[];
  onDetailClick: (id: string) => void;
}

export const StudentThesisDefenceOverviewPanel = ({
  overview,
  history,
  onDetailClick,
}: OverviewPanelProps) => {
  const defenceStatus = overview.defence?.status ?? null;
  const historyItems = history.filter((item) => item.id !== overview.defence?.id);

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Full-width identity card */}
      {overview.defence ? (
        <StudentThesisDefenceIdentityCard
          defence={overview.defence}
          onClick={() => onDetailClick(overview.defence!.id)}
        />
      ) : null}

      {/* Two-column: roadmap left | checklist + documents right */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[14px] items-start">
        {/* Left: vertical roadmap — stretch to match right column height */}
        <div className="self-stretch">
          <StudentThesisDefenceStatusCard
            status={defenceStatus}
            milestones={overview.milestones}
          />
        </div>

        {/* Right: stacked cards */}
        <div className="flex flex-col gap-[14px]">
          <StudentThesisDefenceChecklistRequirementsCard checklist={overview.checklist} />
          <StudentThesisDefenceDocumentCard
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
                Sidang tugas akhir yang tidak lulus atau dibatalkan sebelumnya
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
