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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Full-width identity card */}
      {overview.seminar ? (
        <StudentThesisSeminarIdentityCard
          seminar={overview.seminar}
          onClick={() => onDetailClick(overview.seminar!.id)}
        />
      ) : null}

      {/* Two-column: roadmap left | checklist + documents right */}
      <div
        className="grid grid-cols-1 md:grid-cols-[260px_1fr]"
        style={{ gap: 14, alignItems: 'start' }}
      >
        {/* Left: vertical roadmap — stretch to match right column height */}
        <div style={{ alignSelf: 'stretch' }}>
          <StudentThesisSeminarStatusCard
            status={seminarStatus}
            allChecklistMet={overview.allChecklistMet}
          />
        </div>

        {/* Right: stacked cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StudentThesisSeminarChecklistRequirementsCard checklist={overview.checklist} />
          <StudentThesisSeminarDocumentCard
            allChecklistMet={overview.allChecklistMet}
            documents={overview.seminar?.documents ?? []}
          />
        </div>
      </div>

      {/* Riwayat percobaan — single card with table rows */}
      {historyItems.length > 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e8e8e4',
            borderRadius: 10,
            padding: '16px 18px',
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Riwayat Percobaan</div>
            <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>
              {historyItems.length} percobaan sebelumnya
            </span>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr auto',
              gap: 8,
              padding: '6px 10px',
              marginBottom: 6,
            }}
          >
            {['#', 'Dosen Penguji', 'Tanggal', 'Ruangan', 'Nilai', 'Status', ''].map((col, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#bbb',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
