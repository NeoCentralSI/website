import { ActivityDistributionChart } from '@/components/monitoring/ActivityDistributionChart';
import { BatchDistributionChart } from '@/components/monitoring/BatchDistributionChart';
import { TopicDistributionChart } from '@/components/monitoring/TopicDistributionChart';
import { useYudisiumParticipantSummary } from '@/hooks/yudisium/useYudisiumParticipants';

// Monochrome with the theme accent for the best predicate.
const PREDICATE_COLORS: Record<string, string> = {
  'Dengan Pujian': 'var(--primary)',
  'Sangat Memuaskan': '#475569',
  Memuaskan: '#94a3b8',
  none: '#cbd5e1',
};
const PREDICATE_LABELS: Record<string, string> = { none: 'Tanpa predikat' };

/**
 * Participants of a yudisium period, drawn with the Monitoring charts (as Kelola → Batas
 * Bimbingan): per cohort, per graduation predicate (computed) and per thesis topic.
 */
export function YudisiumParticipantCharts({ yudisiumId }: { yudisiumId: string }) {
  const { data, isLoading } = useYudisiumParticipantSummary(yudisiumId);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BatchDistributionChart
        batchDistribution={data?.enrollmentYears}
        isLoading={isLoading}
        title="Angkatan"
        emptyDescription="Belum ada peserta pada periode ini"
        unit="peserta"
        color="var(--primary)"
      />
      <ActivityDistributionChart
        activityDistribution={data?.predicates}
        isLoading={isLoading}
        title="Predikat Kelulusan"
        emptyDescription="Belum ada peserta pada periode ini"
        labelOf={(value) => PREDICATE_LABELS[value] ?? value}
        colorOf={(value) => PREDICATE_COLORS[value]}
      />
      <TopicDistributionChart
        topicDistribution={data?.topics}
        isLoading={isLoading}
        title="Topik Tugas Akhir"
        emptyDescription="Belum ada peserta pada periode ini"
        unit="peserta"
        colors={['var(--primary)']}
      />
    </div>
  );
}
