import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getYudisiumParticipants,
  getYudisiumParticipantDetail,
  validateYudisiumDocument,
  getParticipantCplScores,
  verifyCplScore,
  createCplRecommendation,
  updateCplRecommendationStatus,
  downloadDraftSk,
  uploadSkResmi,
} from '@/services/yudisium/yudisium-participant.service';
import { toast } from 'sonner';
import type { ValidateDocumentPayload } from '@/types/admin-yudisium.types';

export const participantKeys = {
  all: ['yudisium-participants'] as const,
  list: (yudisiumId: string) => [...participantKeys.all, 'list', yudisiumId] as const,
  detail: (participantId: string) => [...participantKeys.all, 'detail', participantId] as const,
  cplScores: (participantId: string) => [...participantKeys.all, 'cpl-scores', participantId] as const,
};

export function useYudisiumParticipants(yudisiumId: string) {
  return useQuery({
    queryKey: participantKeys.list(yudisiumId),
    queryFn: () => getYudisiumParticipants(yudisiumId),
    enabled: !!yudisiumId,
  });
}

export function useYudisiumParticipantDetail(yudisiumId: string, participantId: string) {
  return useQuery({
    queryKey: participantKeys.detail(participantId),
    queryFn: () => getYudisiumParticipantDetail(yudisiumId, participantId),
    enabled: !!participantId,
  });
}

export function useValidateYudisiumDocument(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      requirementId,
      payload,
    }: {
      participantId: string;
      requirementId: string;
      payload: ValidateDocumentPayload;
    }) => validateYudisiumDocument(yudisiumId, participantId, requirementId, payload),
    onSuccess: (data) => {
      toast.success(data.status === 'approved' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal memvalidasi dokumen');
    },
  });
}

export function useParticipantCplScores(yudisiumId: string, participantId: string) {
  return useQuery({
    queryKey: participantKeys.cplScores(participantId),
    queryFn: () => getParticipantCplScores(yudisiumId, participantId),
    enabled: !!participantId,
  });
}

export function useVerifyCplScore(yudisiumId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cplId: string) => verifyCplScore(yudisiumId, participantId, cplId),
    onSuccess: () => {
      toast.success('CPL berhasil divalidasi');
      void queryClient.invalidateQueries({ queryKey: participantKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useCreateCplRecommendation(yudisiumId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cplId: string; recommendation: string; description: string }) =>
      createCplRecommendation(yudisiumId, participantId, payload),
    onSuccess: () => {
      toast.success('Rekomendasi CPL berhasil dibuat');
      void queryClient.invalidateQueries({ queryKey: participantKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCplRecommendationStatus(yudisiumId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recommendationId, action }: { recommendationId: string; action: 'resolve' | 'unresolve' }) =>
      updateCplRecommendationStatus(recommendationId, action),
    onSuccess: (_data, variables) => {
      toast.success(variables.action === 'resolve' ? 'Rekomendasi diselesaikan' : 'Rekomendasi dibatalkan');
      void queryClient.invalidateQueries({ queryKey: participantKeys.cplScores(participantId) });
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
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
