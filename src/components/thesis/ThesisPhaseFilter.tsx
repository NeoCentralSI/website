import { Button } from '@/components/ui/button';
import { THESIS_PHASE_FILTER_LABELS, type PhaseActivity, type ThesisPhase } from '@/lib/thesisLabels';
import { cn } from '@/lib/utils';

/** Minimum completed research-phase sessions before the results seminar (K7). */
export const MIN_RESEARCH_SESSIONS = 8;

export type PhaseFilterValue = ThesisPhase | '';

/**
 * "Proposal: 3 sesi · Penelitian: 5 dari 8 sesi" (10.7). Proposal sessions have no minimum
 * (K27); only research sessions count toward the seminar (K7).
 */
export function formatPhaseSessionSummary(phases?: { proposal: PhaseActivity; research: PhaseActivity } | null): string | null {
  if (!phases) return null;
  const proposal = `${THESIS_PHASE_FILTER_LABELS.proposal}: ${phases.proposal.guidances.completed} sesi`;
  const research = `${THESIS_PHASE_FILTER_LABELS.research}: ${phases.research.guidances.completed} dari ${MIN_RESEARCH_SESSIONS} sesi`;
  return `${proposal} · ${research}`;
}

interface ThesisPhaseFilterProps {
  value: PhaseFilterValue;
  onChange: (value: PhaseFilterValue) => void;
  /** Shown next to the choices, e.g. from `formatPhaseSessionSummary`. */
  summary?: string | null;
  className?: string;
}

const OPTIONS: { value: PhaseFilterValue; label: string }[] = [
  { value: '', label: 'Semua' },
  { value: 'proposal', label: THESIS_PHASE_FILTER_LABELS.proposal },
  { value: 'research', label: THESIS_PHASE_FILTER_LABELS.research },
];

/** Pilihan fase di atas daftar bimbingan: Semua · Proposal · Penelitian (10.7). */
export function ThesisPhaseFilter({ value, onChange, summary, className }: ThesisPhaseFilterProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div role="group" aria-label="Fase" className="inline-flex rounded-md border p-0.5">
        {OPTIONS.map((option) => (
          <Button
            key={option.value || 'all'}
            type="button"
            size="sm"
            variant={value === option.value ? 'secondary' : 'ghost'}
            aria-pressed={value === option.value}
            className="h-7 px-3"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {summary && <span className="text-sm text-muted-foreground">{summary}</span>}
    </div>
  );
}
