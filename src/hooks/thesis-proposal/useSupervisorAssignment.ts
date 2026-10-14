import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-proposal/supervisor-assignment.service';

export const supervisorAssignmentKeys = {
  overview: (academicYearId?: string | null) => ['thesis-proposal', 'supervisor-assignments', academicYearId ?? 'current'] as const,
  mine: () => ['thesis-proposal', 'me'] as const,
};

export function useMyProposalOverview() {
  return useQuery({ queryKey: supervisorAssignmentKeys.mine(), queryFn: service.getMyProposalOverview });
}

export function useSupervisorAssignmentOverview(academicYearId?: string | null) {
  return useQuery({
    queryKey: supervisorAssignmentKeys.overview(academicYearId),
    queryFn: () => service.getAssignmentOverview(academicYearId),
  });
}

/** Issuing changes request statuses, students' access and lecturers' loads. */
export function useIssueAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.issueAssignment,
    onSuccess: (response) => {
      toast.success(response.message ?? 'Penetapan Pembimbing diterbitkan');
      queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
      queryClient.invalidateQueries({ queryKey: ['supervision-quotas'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
      queryClient.invalidateQueries({ queryKey: ['kadep-quick-actions'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
