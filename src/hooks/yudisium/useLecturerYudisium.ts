import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLecturerYudisiumEvents,
  getLecturerYudisiumParticipants,
  getLecturerYudisiumParticipantDetail,
  getParticipantCplScores,
  verifyCplScore,
  createCplRecommendation,
  updateCplRecommendationStatus,
  downloadDraftSk,
  uploadSkResmi,
} from '@/services/yudisium/lecturer-yudisium.service';
import { toast } from 'sonner';

const lecturerYudisiumKeys = {
  all: ['lecturer-yudisium'] as const,
  events: () => [...lecturerYudisiumKeys.all, 'events'] as const,
  participants: (yudisiumId: string) =>
    [...lecturerYudisiumKeys.all, 'participants', yudisiumId] as const,
  participantDetail: (participantId: string) =>
    [...lecturerYudisiumKeys.all, 'participant-detail', participantId] as const,
  cplScores: (participantId: string) =>
    [...lecturerYudisiumKeys.all, 'cpl-scores', participantId] as const,
};

export function useLecturerYudisiumEvents() {
  return useQuery({
    queryKey: lecturerYudisiumKeys.events(),
    queryFn: getLecturerYudisiumEvents,
  });
}

export function useLecturerYudisiumParticipants(yudisiumId: string) {
  return useQuery({
    queryKey: lecturerYudisiumKeys.participants(yudisiumId),
    queryFn: () => getLecturerYudisiumParticipants(yudisiumId),
    enabled: !!yudisiumId,
  });
}

export function useLecturerYudisiumParticipantDetail(participantId: string) {
  return useQuery({
    queryKey: lecturerYudisiumKeys.participantDetail(participantId),
    queryFn: () => getLecturerYudisiumParticipantDetail(participantId),
    enabled: !!participantId,
  });
}

export function useParticipantCplScores(participantId: string) {
  return useQuery({
    queryKey: lecturerYudisiumKeys.cplScores(participantId),
    queryFn: () => getParticipantCplScores(participantId),
    enabled: !!participantId,
  });
}

export function useVerifyCplScore(participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cplId: string) => verifyCplScore(participantId, cplId),
    onSuccess: () => {
      toast.success('CPL berhasil divalidasi');
      void queryClient.invalidateQueries({ queryKey: lecturerYudisiumKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useCreateCplRecommendation(participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cplId: string; recommendation: string; description: string }) =>
      createCplRecommendation(participantId, payload),
    onSuccess: () => {
      toast.success('Rekomendasi CPL berhasil dibuat');
      void queryClient.invalidateQueries({ queryKey: lecturerYudisiumKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCplRecommendationStatus(participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recommendationId, action }: { recommendationId: string; action: 'resolve' | 'unresolve' }) =>
      updateCplRecommendationStatus(recommendationId, action),
    onSuccess: (_data, variables) => {
      toast.success(variables.action === 'resolve' ? 'Rekomendasi diselesaikan' : 'Rekomendasi dibatalkan');
      void queryClient.invalidateQueries({ queryKey: lecturerYudisiumKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDownloadDraftSk() {
  return useMutation({
    mutationFn: (yudisiumId: string) => downloadDraftSk(yudisiumId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'draft-sk-yudisium.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Draft SK berhasil diunduh');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUploadSkResmi(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { file: File; eventDate: string; decreeNumber: string; decreeIssuedAt: string }) =>
      uploadSkResmi(yudisiumId, payload),
    onSuccess: () => {
      toast.success('SK resmi berhasil diunggah');
      void queryClient.invalidateQueries({ queryKey: lecturerYudisiumKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
