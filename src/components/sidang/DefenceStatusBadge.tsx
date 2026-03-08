import {
  ThesisWorkflowStatusBadge,
  getThesisWorkflowStatusFilterOptions,
} from '@/components/shared/ThesisWorkflowStatusBadge';
import type { ThesisDefenceStatus } from '@/types/defence.types';

export function DefenceStatusBadge({ status }: { status: ThesisDefenceStatus }) {
  return <ThesisWorkflowStatusBadge status={status} />;
}

export function getDefenceStatusFilterOptions() {
  return getThesisWorkflowStatusFilterOptions({ includeOngoing: true });
}
