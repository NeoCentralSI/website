import { THESIS_PHASE_FILTER_LABELS, type PhaseActivity, type ThesisPhase } from '@/lib/thesisLabels';

/** Minimum completed research-phase sessions before the results seminar (K7). */
export const MIN_RESEARCH_SESSIONS = 8;

/**
 * Phase filter value of the guidance lists: Semua ('') · Proposal · Penelitian. Paket E4 (2.2):
 * the choice lives in the "Jenis" column header of the table, not above it.
 */
export type PhaseFilterValue = ThesisPhase | '';

/**
 * "Proposal: 3 sesi · Penelitian: 5 dari 8 sesi" (10.7). Proposal sessions have no minimum
 * (K27); only research sessions count toward the seminar (K7). Paket E4 (2.2): shown only on
 * the Overview, not above the guidance table.
 */
export function formatPhaseSessionSummary(phases?: { proposal: PhaseActivity; research: PhaseActivity } | null): string | null {
  if (!phases) return null;
  const proposal = `${THESIS_PHASE_FILTER_LABELS.proposal}: ${phases.proposal.guidances.completed} sesi`;
  const research = `${THESIS_PHASE_FILTER_LABELS.research}: ${phases.research.guidances.completed} dari ${MIN_RESEARCH_SESSIONS} sesi`;
  return `${proposal} · ${research}`;
}
