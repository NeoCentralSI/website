import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getYudisiumParticipants,
  getYudisiumParticipantDetail,
  verifyYudisiumDocument,
  getParticipantCplScores,
  validateCplScore,
  repairCplScore,
  exportParticipants,
  finalizeParticipants,
  getArchiveYudisiumParticipantOptions,
  addArchiveYudisiumParticipant,
  importArchiveYudisiumParticipants,
  deleteArchiveYudisiumParticipant,
} from '@/services/yudisium/participant.service';
import { toast } from 'sonner';
import type { VerifyDocumentPayload } from '@/types/admin-yudisium.types';

export const participantKeys = {
  all: ['yudisium-participants'] as const,
  list: (yudisiumId: string) => [...participantKeys.all, 'list', yudisiumId] as const,
  archiveOptions: (yudisiumId: string) => [...participantKeys.all, 'archive-options', yudisiumId] as const,
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

export function useArchiveYudisiumParticipantOptions(yudisiumId: string, enabled = true) {
  return useQuery({
    queryKey: participantKeys.archiveOptions(yudisiumId),
    queryFn: () => getArchiveYudisiumParticipantOptions(yudisiumId),
    enabled: !!yudisiumId && enabled,
  });
}

export function useAddArchiveYudisiumParticipant(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ thesisId }: { thesisId: string }) => addArchiveYudisiumParticipant(yudisiumId, thesisId),
    onSuccess: () => {
      toast.success('Peserta yudisium berhasil ditambahkan');
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.archiveOptions(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menambahkan peserta yudisium');
    },
  });
}

export function useDeleteArchiveYudisiumParticipant(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId }: { participantId: string }) =>
      deleteArchiveYudisiumParticipant(yudisiumId, participantId),
    onSuccess: () => {
      toast.success('Peserta yudisium berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.archiveOptions(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus peserta yudisium');
    },
  });
}

export function useImportArchiveYudisiumParticipants(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file }: { file: File }) => importArchiveYudisiumParticipants(yudisiumId, file),
    onSuccess: (result) => {
      if (result.failed > 0 && result.successCount > 0) {
        toast.warning(`${result.successCount} peserta berhasil diimpor, ${result.failed} gagal`);
      } else if (result.failed > 0) {
        toast.error('Tidak ada peserta yang berhasil diimpor');
      } else {
        toast.success('Peserta yudisium berhasil diimpor');
      }
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.archiveOptions(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengimpor peserta yudisium');
    },
  });
}

export function useVerifyYudisiumDocument(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participantId,
      requirementId,
      payload,
    }: {
      participantId: string;
      requirementId: string;
      payload: VerifyDocumentPayload;
    }) => verifyYudisiumDocument(yudisiumId, participantId, requirementId, payload),
    onSuccess: (data) => {
      toast.success(data.status === 'approved' ? 'Dokumen disetujui' : 'Dokumen ditolak');
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal memverifikasi dokumen');
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

export function useValidateCplScore(yudisiumId: string, participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cplId: string) => validateCplScore(yudisiumId, participantId, cplId),
    onSuccess: () => {
      toast.success('CPL berhasil divalidasi');
      void queryClient.invalidateQueries({ queryKey: participantKeys.cplScores(participantId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.detail(participantId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
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
      void queryClient.invalidateQueries({ queryKey: participantKeys.detail(participantId) });
      void queryClient.invalidateQueries({ queryKey: participantKeys.list(yudisiumId) });
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

export function useFinalizeParticipants(yudisiumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => finalizeParticipants(yudisiumId),
    onSuccess: () => {
      toast.success('Peserta yudisium berhasil difinalisasi');
      void queryClient.invalidateQueries({ queryKey: participantKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['yudisium-events'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
