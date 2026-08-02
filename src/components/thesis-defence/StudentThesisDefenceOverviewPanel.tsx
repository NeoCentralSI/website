import { StudentThesisDefenceStatusCard } from './StudentThesisDefenceStatusCard';
import { StudentThesisDefenceIdentityCard } from './StudentThesisDefenceIdentityCard';
import { StudentThesisDefenceChecklistRequirementsCard } from './StudentThesisDefenceChecklistRequirementsCard';
import { StudentThesisDefenceDocumentCard } from './StudentThesisDefenceDocumentCard';
import { StudentThesisDefenceHistoryCard } from './StudentThesisDefenceHistoryCard';
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

      {/* Riwayat percobaan — single card with table rows */}
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

          <div className="overflow-x-auto">
            <div className="grid min-w-[820px] grid-cols-[48px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_80px_minmax(145px,1fr)_104px] items-center gap-4 border-y border-gray-200 bg-muted/40 px-4 py-2.5">
              {['No', 'Dosen Penguji', 'Tanggal', 'Ruangan', 'Nilai', 'Status', 'Aksi'].map((column) => (
                <span key={column} className="text-xs font-medium text-muted-foreground">
                  {column}
                </span>
              ))}
            </div>

            {historyItems.map((item, index) => (
              <StudentThesisDefenceHistoryCard
                key={item.id}
                index={index + 1}
                item={item}
                onClick={() => onDetailClick(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
