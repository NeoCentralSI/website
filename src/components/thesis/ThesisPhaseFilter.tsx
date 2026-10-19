import { THESIS_PHASE_FILTER_LABELS, type PhaseActivity, type ThesisPhase } from '@/lib/thesisLabels';

/** Minimum completed research-phase sessions before the results seminar. */
export const MIN_RESEARCH_SESSIONS = 8;

/**
 * Phase filter value of the guidance lists: Semua ('') · Proposal · Penelitian. The
 * choice lives in the "Jenis" column header of the table, not above it.
 */
export type PhaseFilterValue = ThesisPhase | '';

/**
 * "Proposal: 3 sesi · Penelitian: 5 dari 8 sesi". Proposal sessions have no minimum;
 * only research sessions count toward the seminar. Shown only on
 * the Overview, not above the guidance table.
 */
export function formatPhaseSessionSummary(phases?: { proposal: PhaseActivity; research: PhaseActivity } | null): string | null {
  if (!phases) return null;
  const proposal = `${THESIS_PHASE_FILTER_LABELS.proposal}: ${phases.proposal.guidances.completed} sesi`;
  const research = `${THESIS_PHASE_FILTER_LABELS.research}: ${phases.research.guidances.completed} dari ${MIN_RESEARCH_SESSIONS} sesi`;
  return `${proposal} · ${research}`;
}
