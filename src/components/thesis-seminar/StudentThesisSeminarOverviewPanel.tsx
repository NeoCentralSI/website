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
    <div className="mt-6 space-y-6">
      <StudentThesisSeminarStatusCard
        status={seminarStatus}
        allChecklistMet={overview.allChecklistMet}
      />

      {overview.seminar ? (
        <StudentThesisSeminarIdentityCard
          seminar={overview.seminar}
          onClick={() => onDetailClick(overview.seminar!.id)}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentThesisSeminarChecklistRequirementsCard checklist={overview.checklist} />
        <StudentThesisSeminarDocumentCard
          allChecklistMet={overview.allChecklistMet}
          documents={overview.seminar?.documents ?? []}
        />
      </div>

      {historyItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Riwayat Percobaan Seminar Hasil</h2>
          <div className="space-y-3">
            {historyItems.map((item) => (
              <StudentThesisSeminarHistoryCard
                key={item.id}
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
