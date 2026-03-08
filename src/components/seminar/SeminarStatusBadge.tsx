import {
  ThesisWorkflowStatusBadge,
  getThesisWorkflowStatusFilterOptions,
  getThesisWorkflowStatusLabel,
} from '@/components/shared/ThesisWorkflowStatusBadge';
import type { ThesisSeminarStatus } from '@/types/seminar.types';

interface SeminarStatusBadgeProps {
  status: ThesisSeminarStatus;
}

export function SeminarStatusBadge({ status }: SeminarStatusBadgeProps) {
  return <ThesisWorkflowStatusBadge status={status} />;
}

/**
 * Get display label for a given seminar status
 */
export function getSeminarStatusLabel(status: ThesisSeminarStatus): string {
  return getThesisWorkflowStatusLabel(status);
}

/**
 * Get the admin-facing display group for status filter
 */
export function getStatusFilterOptions() {
  return getThesisWorkflowStatusFilterOptions({ includeOngoing: true });
}
