import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-guidance-evaluation/thesis-guidance-evaluation.service';
import type { SubmitEvaluationDto } from '@/types/thesis-guidance-evaluation.types';

export const thesisGuidanceEvaluationKeys = {
  all: ['thesis-guidance-evaluations'] as const,
  context: (thesisId?: string) => ['thesis-guidance-evaluations', 'context', thesisId ?? 'mine'] as const,
  department: (scope: string, search: string, page: number, pageSize: number) =>
    ['thesis-guidance-evaluations', 'department', scope, search, page, pageSize] as const,
  lecturer: () => ['thesis-guidance-evaluations', 'lecturer'] as const,
};

export function useEvaluationContext(thesisId?: string, enabled = true) {
  return useQuery({
    queryKey: thesisGuidanceEvaluationKeys.context(thesisId),
    queryFn: () => service.getEvaluationContext(thesisId),
    enabled,
  });
}

export function useDepartmentEvaluations(params: { scope: 'pending' | 'history'; search: string; page: number; pageSize: number }, enabled = true) {
  return useQuery({
    queryKey: thesisGuidanceEvaluationKeys.department(params.scope, params.search, params.page, params.pageSize),
    queryFn: () => service.getDepartmentEvaluations({ ...params, search: params.search || undefined }),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useSupervisorEvaluations(enabled = true) {
  return useQuery({ queryKey: thesisGuidanceEvaluationKeys.lecturer(), queryFn: service.getSupervisorEvaluations, enabled });
}

/** An evaluation may change the thesis status, so every list that shows it is refreshed. */
function useRefreshAfterEvaluation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: thesisGuidanceEvaluationKeys.all });
    queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
    queryClient.invalidateQueries({ queryKey: ['student-detail'] });
    queryClient.invalidateQueries({ queryKey: ['my-thesis-detail'] });
    queryClient.invalidateQueries({ queryKey: ['monitoring'] });
  };
}

export function useSubmitEvaluation() {
  const refresh = useRefreshAfterEvaluation();
  return useMutation({
    mutationFn: (dto: SubmitEvaluationDto) => service.submitEvaluation(dto),
    onSuccess: (result) => {
      toast.success(result.message || 'Evaluasi bimbingan tersimpan');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDecideEvaluation() {
  const refresh = useRefreshAfterEvaluation();
  return useMutation({
    mutationFn: ({ evaluationId, ...dto }: { evaluationId: string; approve: boolean; notes?: string | null }) =>
      service.decideEvaluation(evaluationId, dto),
    onSuccess: (result) => {
      toast.success(result.message || 'Keputusan disimpan');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
