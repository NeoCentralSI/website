import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-proposal/proposal-revision.service';
import type { ProposalRevisionAction } from '@/types/thesis-proposal.types';
import { supervisorAssignmentKeys } from './useSupervisorAssignment';

export const proposalRevisionKeys = {
  lecturer: (thesisId: string) => ['thesis-proposal', 'proposal-revision', thesisId] as const,
};

/** Student upload; the Proposal page and the thesis views refresh. */
export function useSubmitProposalRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.submitProposalRevision,
    onSuccess: (response) => {
      toast.success(response.message ?? 'Proposal revisi diajukan');
      queryClient.invalidateQueries({ queryKey: supervisorAssignmentKeys.mine() });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLecturerProposalRevision(thesisId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: proposalRevisionKeys.lecturer(thesisId ?? ''),
    queryFn: () => service.getProposalRevision(thesisId as string),
    enabled: Boolean(thesisId) && enabled,
  });
}

/** Approving returns the thesis to research: the whole student detail refreshes. */
export function useReviewProposalRevision(thesisId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: ProposalRevisionAction; notes?: string | null }) =>
      service.reviewProposalRevision(id, { action, notes }),
    onSuccess: (response) => {
      toast.success(response.message ?? 'Tinjauan disimpan');
      queryClient.invalidateQueries({ queryKey: proposalRevisionKeys.lecturer(thesisId) });
      queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
      queryClient.invalidateQueries({ queryKey: ['thesis-guidance-evaluations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
