import { SeminarStatusStepper } from './StudentThesisSeminarStatusCard';
import { StudentThesisSeminarIdentityCard } from './StudentThesisSeminarIdentityCard';
import { StudentThesisSeminarChecklistRequirementsCard } from './StudentThesisSeminarChecklistRequirementsCard';
import { StudentThesisSeminarDocumentCard } from './StudentThesisSeminarDocumentCard';
import { StudentThesisSeminarHistoryCard } from './StudentThesisSeminarHistoryCard';
import type { ThesisSeminarStatus, SeminarHistoryItem, StudentSeminarOverview } from '@/types/seminar.types';

interface OverviewPanelProps {
  data: StudentSeminarOverview;
  history: SeminarHistoryItem[];
  onDetailClick: (seminarId: string) => void;
}

export const StudentThesisSeminarOverviewPanel = ({ data, history, onDetailClick }: OverviewPanelProps) => {
  const seminarStatus = data.seminar?.status ?? null;
  const isPassed = seminarStatus === 'passed' || seminarStatus === 'passed_with_revision';
  
  // Filter history to only show failed/cancelled or previous attempts
  const historyItems = history.filter(item => !isPassed || item.id !== data.seminar?.id);

  return (
    <div className="space-y-6">
      {/* Status Stepper */}
      <SeminarStatusStepper 
        status={seminarStatus} 
        allChecklistMet={data.allChecklistMet} 
      />

      {/* Identity Card (Current Seminar) */}
      {data.seminar && (
        <StudentThesisSeminarIdentityCard 
          seminar={data.seminar} 
          onClick={() => onDetailClick(data.seminar!.id)}
        />
      )}

      {/* Requirements & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentThesisSeminarChecklistRequirementsCard 
          checklist={data.checklist} 
          isRecap={isPassed}
        />
        <StudentThesisSeminarDocumentCard 
          allChecklistMet={data.allChecklistMet} 
        />
      </div>

      {/* History Session */}
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
