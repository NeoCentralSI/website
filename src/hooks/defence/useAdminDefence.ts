import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDefenceList,
  getAdminDefenceDetail,
  validateDefenceDocument,
} from '@/services/adminDefence.service';
import type { ValidateDefenceDocumentPayload } from '@/types/defence.types';

export function useAdminDefenceList(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin-defences', params?.search, params?.status],
    queryFn: () => getAdminDefenceList(params),
  });
}

export function useAdminDefenceDetail(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['admin-defence-detail', defenceId],
    queryFn: () => getAdminDefenceDetail(defenceId!),
    enabled: !!defenceId,
  });
}

export function useValidateDefenceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      defenceId,
      documentTypeId,
      payload,
    }: {
      defenceId: string;
      documentTypeId: string;
      payload: ValidateDefenceDocumentPayload;
    }) => validateDefenceDocument(defenceId, documentTypeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-defence-detail', variables.defenceId],
      });
    },
  });
}
