import { useMemo } from 'react';

import { ActivityDistributionChart } from '@/components/monitoring/ActivityDistributionChart';
import { TopicDistributionChart } from '@/components/monitoring/TopicDistributionChart';
import { SUPERVISION_LOAD_LEVEL_LABELS, type SupervisionLoadLevel } from '@/lib/thesisLabels';
import type { LecturerLoadRow } from '@/types/thesis-proposal.types';

const LEVEL_COLORS: Record<SupervisionLoadLevel, string> = { full: '#ef4444', near_limit: '#f59e0b', available: '#22c55e' };
const LEVELS: SupervisionLoadLevel[] = ['full', 'near_limit', 'available'];

const STAGES = [
  { value: 'waitingAssignment', label: 'Menunggu Penetapan', color: '#f59e0b' },
  { value: 'proposal', label: 'Proposal', color: '#3b82f6' },
  { value: 'research', label: 'Penelitian', color: '#22c55e' },
] as const;
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));
const STAGE_COLORS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.color]));

/**
 * Paket P9 (6): the three charts of Kelola → Batas Bimbingan, drawn with the Monitoring charts:
 * lecturers per load level, supervisions per kelompok keilmuan, and supervisions per stage.
 */
export function SupervisionLoadCharts({ lecturers, isLoading }: { lecturers: LecturerLoadRow[] | undefined; isLoading: boolean }) {
  const { levels, groups, stages } = useMemo(() => {
    const rows = lecturers ?? [];
    const byGroup = new Map<string, { id: string; name: string; count: number }>();
    for (const row of rows) {
      const id = row.scienceGroup?.id ?? 'none';
      const entry = byGroup.get(id) ?? { id, name: row.scienceGroup?.name ?? 'Belum diisi', count: 0 };
      entry.count += row.activeCount;
      byGroup.set(id, entry);
    }
    return {
      levels: LEVELS.map((level) => ({ id: level, name: level, value: level, count: rows.filter((r) => r.level === level).length })).filter((r) => r.count > 0),
      groups: [...byGroup.values()].filter((g) => g.count > 0).sort((a, b) => b.count - a.count),
      stages: STAGES.map((stage) => ({ id: stage.value, name: stage.value, value: stage.value, count: rows.reduce((sum, r) => sum + (r.breakdown[stage.value] ?? 0), 0) })).filter((r) => r.count > 0),
    };
  }, [lecturers]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ActivityDistributionChart
        activityDistribution={levels}
        isLoading={isLoading}
        title="Tingkat Beban Dosen"
        emptyDescription="Belum ada data dosen"
        labelOf={(value) => SUPERVISION_LOAD_LEVEL_LABELS[value as SupervisionLoadLevel] ?? value}
        colorOf={(value) => LEVEL_COLORS[value as SupervisionLoadLevel]}
      />
      <TopicDistributionChart topicDistribution={groups} isLoading={isLoading} title="Beban per Kelompok Keilmuan" emptyDescription="Belum ada bimbingan aktif" unit="bimbingan" />
      <ActivityDistributionChart
        activityDistribution={stages}
        isLoading={isLoading}
        title="Bimbingan per Tahap"
        emptyDescription="Belum ada bimbingan aktif"
        labelOf={(value) => STAGE_LABELS[value] ?? value}
        colorOf={(value) => STAGE_COLORS[value]}
      />
    </div>
  );
}
