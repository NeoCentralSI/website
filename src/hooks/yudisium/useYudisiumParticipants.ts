import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getYudisiumParticipants,
  getYudisiumParticipantDetail,
  validateYudisiumDocument,
  getParticipantCplScores,
  verifyCplScore,
  repairCplScore,
  exportParticipants,
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

export function useRepairCplScore(yudisiumId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cplId,
      payload,
    }: {
      cplId: string;
      payload: { newScore: number; oldScore: number; recommendation: File | null; settlement: File | null };
    }) => repairCplScore(yudisiumId, participantId, cplId, payload),
    onSuccess: () => {
      toast.success('Perbaikan CPL berhasil disimpan');
      void queryClient.invalidateQueries({ queryKey: participantKeys.cplScores(participantId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useExportParticipants() {
  return useMutation({
    mutationFn: (yudisiumId: string) => exportParticipants(yudisiumId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data-peserta-yudisium.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Data peserta yudisium berhasil diunduh');
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
