import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/research-method/research-method.service';
import type { AssessorParty, ScoreInput } from '@/types/research-method.types';

export const researchMethodKeys = {
  all: ['research-method'] as const,
  attendance: (academicYearId?: string | null) => ['research-method', 'attendance', academicYearId ?? '-'] as const,
  form: (party: AssessorParty, academicYearId?: string | null) => ['research-method', 'form', party, academicYearId ?? '-'] as const,
  supervisorQueue: (academicYearId?: string | null) => ['research-method', 'supervisor-queue', academicYearId ?? 'current'] as const,
  coordinatorQueue: (academicYearId?: string | null) => ['research-method', 'coordinator-queue', academicYearId ?? 'current'] as const,
  promotion: () => ['research-method', 'promotion'] as const,
  monitoring: (academicYearId?: string | null) => ['research-method', 'monitoring', academicYearId ?? 'current'] as const,
};

/** Anything that changes scores or attendance refreshes every view of the class. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: researchMethodKeys.all });
    queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    queryClient.invalidateQueries({ queryKey: ['my-thesis-detail'] });
  };
}

export const useAttendance = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.attendance(academicYearId), queryFn: () => service.getAttendance(academicYearId as string), enabled: Boolean(academicYearId) });

export function useAttendanceUpload() {
  const refresh = useRefresh();
  return {
    preview: useMutation({
      mutationFn: ({ academicYearId, files }: { academicYearId: string; files: File[] }) => service.previewAttendance(academicYearId, files),
      onError: (error: Error) => toast.error(error.message),
    }),
    upload: useMutation({
      mutationFn: ({ academicYearId, files }: { academicYearId: string; files: File[] }) => service.uploadAttendance(academicYearId, files),
      onSuccess: (response) => {
        toast.success(response.message ?? 'Presensi diunggah');
        refresh();
      },
      onError: (error: Error) => toast.error(error.message),
    }),
  };
}

export const useAssessmentForm = (party: AssessorParty, academicYearId?: string | null, enabled = true) =>
  useQuery({ queryKey: researchMethodKeys.form(party, academicYearId), queryFn: () => service.getAssessmentForm(party, academicYearId as string), enabled: enabled && Boolean(academicYearId) });

export const useSupervisorQueue = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.supervisorQueue(academicYearId), queryFn: () => service.getSupervisorQueue(academicYearId) });

export const useCoordinatorQueue = (academicYearId?: string | null) =>
  useQuery({ queryKey: researchMethodKeys.coordinatorQueue(academicYearId), queryFn: () => service.getCoordinatorQueue(academicYearId) });

export function useSubmitScore() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, party, scores }: { id: string; party: AssessorParty; scores: ScoreInput[] }) => service.submitScore(id, party, scores),
    onSuccess: (response) => {
      toast.success(response.message ?? 'Nilai dikirim');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export const usePromotionPreview = (enabled = true) =>
  useQuery({ queryKey: researchMethodKeys.promotion(), queryFn: service.getPromotionPreview, enabled });

export function useRunPromotion() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: service.runPromotion,
    onSuccess: (response) => {
      const promoted = response.data?.promoted?.length ?? 0;
      toast.success(`Proses kelulusan selesai: ${promoted} naik ke fase Penelitian`);
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
