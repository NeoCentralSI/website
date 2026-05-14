import { StudentThesisDefenceStatusCard } from './StudentThesisDefenceStatusCard';
import { StudentThesisDefenceIdentityCard } from './StudentThesisDefenceIdentityCard';
import { StudentThesisDefenceChecklistRequirementsCard } from './StudentThesisDefenceChecklistRequirementsCard';
import { StudentThesisDefenceDocumentCard } from './StudentThesisDefenceDocumentCard';
import { StudentThesisDefenceHistoryCard } from './StudentThesisDefenceHistoryCard';
import type { StudentDefenceOverview, StudentDefenceHistoryItem } from '@/types/defence.types';

interface OverviewPanelProps {
  overview: StudentDefenceOverview;
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
            allChecklistMet={overview.allChecklistMet}
            milestones={overview.milestones}
          />
        </div>

        {/* Right: stacked cards */}
        <div className="flex flex-col gap-[14px]">
          <StudentThesisDefenceChecklistRequirementsCard checklist={overview.checklist} />
          <StudentThesisDefenceDocumentCard
            allChecklistMet={overview.allChecklistMet}
            documents={overview.defence?.documents ?? []}
          />
        </div>
      </div>

      {/* Riwayat percobaan — single card with table rows */}
      {historyItems.length > 0 && (
        <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
          {/* Card header */}
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-base font-semibold text-foreground">Riwayat Percobaan</div>
            <span className="text-xs text-muted-foreground font-medium">
              {historyItems.length} percobaan sebelumnya
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 px-[10px] py-[6px] mb-[6px]">
            {['#', 'Dosen Penguji', 'Tanggal', 'Ruangan', 'Skor', 'Status', ''].map((col, i) => (
              <span
                key={i}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-2">
            {historyItems.map((item, idx) => (
              <StudentThesisDefenceHistoryCard
                key={item.id}
                index={idx + 1}
                item={item}
                onClick={() => onDetailClick(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
