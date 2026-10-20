import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/research-method/research-method.service';
import type { AssessorParty, ScoreInput } from '@/types/research-method.types';

export const researchMethodKeys = {
  all: ['research-method'] as const,
  form: (party: AssessorParty, academicYearId?: string | null) => ['research-method', 'form', party, academicYearId ?? '-'] as const,
  supervisorQueue: (academicYearId?: string | null) => ['research-method', 'supervisor-queue', academicYearId ?? 'current'] as const,
  coordinatorQueue: (academicYearId?: string | null) => ['research-method', 'coordinator-queue', academicYearId ?? 'current'] as const,
  scoreForm: (id: string, party: AssessorParty) => ['research-method', 'score-form', party, id] as const,
  monitoring: (academicYearId?: string | null) => ['research-method', 'monitoring', academicYearId ?? 'current'] as const,
};

/** Anything that changes scores refreshes every view of the class (a pass also moves the thesis). */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: researchMethodKeys.all });
    queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    queryClient.invalidateQueries({ queryKey: ['my-thesis-detail'] });
  };
}

export const useAssessmentForm = (party: AssessorParty, academicYearId?: string | null, enabled = true) =>
  useQuery({ queryKey: researchMethodKeys.form(party, academicYearId), queryFn: () => service.getAssessmentForm(party, academicYearId as string), enabled: enabled && Boolean(academicYearId) });

export const useSupervisorQueue = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.supervisorQueue(academicYearId), queryFn: () => service.getSupervisorQueue(academicYearId) });

export const useCoordinatorQueue = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.coordinatorQueue(academicYearId), queryFn: () => service.getCoordinatorQueue(academicYearId) });

export const useAssessmentScoreForm = (id: string | undefined, party: AssessorParty) =>
  useQuery({ queryKey: researchMethodKeys.scoreForm(id ?? '-', party), queryFn: () => service.getAssessmentScoreForm(id as string, party), enabled: Boolean(id) });

export function useSubmitScore() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, party, scores, isDraft }: { id: string; party: AssessorParty; scores: ScoreInput[]; isDraft: boolean }) =>
      service.submitScore(id, party, scores, isDraft),
    onSuccess: (response, variables) => {
      toast.success(response.message ?? (variables.isDraft ? 'Draf penilaian disimpan' : 'Nilai dikirim'));
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export const useClassMonitoring = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.monitoring(academicYearId), queryFn: () => service.getMonitoring(academicYearId) });

export function useSetMinimumScore() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ academicYearId, minimumScore }: { academicYearId: string; minimumScore: number }) => service.setMinimumScore(academicYearId, minimumScore),
    onSuccess: (response) => {
      toast.success(response.message ?? 'Nilai minimum disimpan');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
