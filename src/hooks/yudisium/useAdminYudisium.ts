import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminYudisiumEvents,
  getAdminYudisiumParticipants,
  getAdminYudisiumParticipantDetail,
  validateYudisiumDocument,
} from '@/services/adminYudisium.service';
import type { ValidateDocumentPayload } from '@/types/adminYudisium.types';
import { toast } from 'sonner';

const adminYudisiumKeys = {
  all: ['admin-yudisium'] as const,
  events: () => [...adminYudisiumKeys.all, 'events'] as const,
  participants: (yudisiumId: string) =>
    [...adminYudisiumKeys.all, 'participants', yudisiumId] as const,
  participantDetail: (participantId: string) =>
    [...adminYudisiumKeys.all, 'participant-detail', participantId] as const,
};

export function useAdminYudisiumEvents() {
  return useQuery({
    queryKey: adminYudisiumKeys.events(),
    queryFn: getAdminYudisiumEvents,
  });
}

export function useAdminYudisiumParticipants(yudisiumId: string) {
  return useQuery({
    queryKey: adminYudisiumKeys.participants(yudisiumId),
    queryFn: () => getAdminYudisiumParticipants(yudisiumId),
    enabled: !!yudisiumId,
  });
}

export function useAdminYudisiumParticipantDetail(participantId: string) {
  return useQuery({
    queryKey: adminYudisiumKeys.participantDetail(participantId),
    queryFn: () => getAdminYudisiumParticipantDetail(participantId),
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
    }) => validateYudisiumDocument(participantId, requirementId, payload),
    onSuccess: (data) => {
      toast.success(
        data.status === 'approved' ? 'Dokumen disetujui' : 'Dokumen ditolak'
      );
      queryClient.invalidateQueries({
        queryKey: adminYudisiumKeys.participants(yudisiumId),
      });
      queryClient.invalidateQueries({
        queryKey: adminYudisiumKeys.all,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memvalidasi dokumen');
    },
  });
}
