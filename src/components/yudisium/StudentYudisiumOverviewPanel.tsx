import { useNavigate } from 'react-router-dom';
import { CalendarX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentYudisiumIdentityCard } from './StudentYudisiumIdentityCard';
import { StudentYudisiumStatusCard } from './StudentYudisiumStatusCard';
import { StudentYudisiumChecklistRequirementsCard } from './StudentYudisiumChecklistRequirementsCard';
import { StudentYudisiumDocumentCard } from './StudentYudisiumDocumentCard';
import { StudentYudisiumCplTable } from './StudentYudisiumCplTable';
import { StudentYudisiumHistoryCard } from './StudentYudisiumHistoryCard';
import type { StudentYudisiumOverviewResponse, StudentYudisiumHistoryItem } from '@/types/student-yudisium.types';

interface OverviewPanelProps {
  overview: StudentYudisiumOverviewResponse;
  history: StudentYudisiumHistoryItem[];
  onDetailClick: (id: string, yudisiumId: string) => void;
  onRefetch?: () => void;
}

export function StudentYudisiumOverviewPanel({
  overview,
  history,
  onDetailClick,
  onRefetch,
}: OverviewPanelProps) {
  const navigate = useNavigate();
  const yudisium = overview.yudisium;
  const isRegistrationOpen = yudisium?.status === 'open';
  const historyItems = (history || []).filter((item) => item.id !== overview.participantId);

  return (
    <div className="flex flex-col gap-[14px]">
      {yudisium ? (
        <StudentYudisiumIdentityCard overview={overview} />
      ) : (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-card">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 rounded-lg border border-gray-200 bg-muted/40 p-2 text-muted-foreground">
                <CalendarX2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Periode Yudisium Belum Tersedia</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Belum ada periode yudisium yang dibuka. Persiapkan persyaratan terlebih dahulu. Upload dokumen dan exit survey akan aktif saat periode dibuka.
                </p>
              </div>
            </div>
            {onRefetch ? (
              <Button variant="outline" size="sm" onClick={onRefetch}>
                Muat ulang
              </Button>
            ) : null}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[14px] items-start">
        <div className="self-stretch">
          <StudentYudisiumStatusCard overview={overview} />
        </div>

        <div className="flex flex-col gap-[14px]">
          {overview.checklist && (
            <StudentYudisiumChecklistRequirementsCard
              checklist={overview.checklist}
              isYudisiumOpen={isRegistrationOpen}
              onExitSurveyClick={() => navigate('/yudisium/exit-survey')}
            />
          )}

          <StudentYudisiumDocumentCard
            allChecklistMet={overview.allChecklistMet ?? false}
            participantStatus={overview.participantStatus}
            isRegistrationOpen={isRegistrationOpen}
            fallbackRequirements={overview.requirements ?? []}
          />
        </div>
      </div>

      {overview.cplScores && overview.cplScores.length > 0 && (
        <StudentYudisiumCplTable cplScores={overview.cplScores} />
      )}

      {historyItems.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-card">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Riwayat Pendaftaran Yudisium</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pendaftaran yudisium pada periode sebelumnya
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {historyItems.length} Pendaftaran
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[820px] grid-cols-[48px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_minmax(145px,1fr)_104px] items-center gap-4 border-y border-gray-200 bg-muted/40 px-4 py-2.5">
              {['No', 'Periode Yudisium', 'Rentang Pendaftaran', 'Pelaksanaan', 'Status', 'Aksi'].map((column) => (
                <span key={column} className="text-xs font-medium text-muted-foreground">
                  {column}
                </span>
              ))}
            </div>

            {historyItems.map((item, index) => (
              <StudentYudisiumHistoryCard
                key={item.id}
                index={index + 1}
                item={item}
                onClick={() => onDetailClick(item.id, item.yudisiumId || '')}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
