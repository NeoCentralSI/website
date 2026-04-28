import { StudentThesisSeminarStatusCard } from './StudentThesisSeminarStatusCard';
import { StudentThesisSeminarIdentityCard } from './StudentThesisSeminarIdentityCard';
import { StudentThesisSeminarChecklistRequirementsCard } from './StudentThesisSeminarChecklistRequirementsCard';
import { StudentThesisSeminarDocumentCard } from './StudentThesisSeminarDocumentCard';
import { StudentThesisSeminarHistoryCard } from './StudentThesisSeminarHistoryCard';
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
            allChecklistMet={overview.allChecklistMet}
          />
        </div>

        {/* Right: stacked cards */}
        <div className="flex flex-col gap-[14px]">
          <StudentThesisSeminarChecklistRequirementsCard checklist={overview.checklist} />
          <StudentThesisSeminarDocumentCard
            allChecklistMet={overview.allChecklistMet}
            documents={overview.seminar?.documents ?? []}
          />
        </div>
      </div>

      {/* Riwayat percobaan — single card with table rows */}
      {historyItems.length > 0 && (
        <div className="bg-white border border-[#e8e8e4] rounded-[10px] p-[16px_18px]">
          {/* Card header */}
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-[13px] font-bold text-[#111]">Riwayat Percobaan</div>
            <span className="text-[11px] text-[#aaa] font-medium">
              {historyItems.length} percobaan sebelumnya
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 px-[10px] py-[6px] mb-[6px]">
            {['#', 'Dosen Penguji', 'Tanggal', 'Ruangan', 'Nilai', 'Status', ''].map((col, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-[#bbb] uppercase tracking-[0.4px]"
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-2">
            {historyItems.map((item, idx) => (
              <StudentThesisSeminarHistoryCard
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
