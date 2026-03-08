import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDefenceList,
  getAdminDefenceDetail,
  validateDefenceDocument,
  getDefenceSchedulingData,
  setDefenceSchedule,
} from '@/services/adminDefence.service';
import type { ValidateDefenceDocumentPayload, SetDefenceSchedulePayload } from '@/types/defence.types';

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

export function useDefenceSchedulingData(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['admin-defence-scheduling', defenceId],
    queryFn: () => getDefenceSchedulingData(defenceId!),
    enabled: !!defenceId,
  });
}

export function useSetDefenceSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      defenceId,
      payload,
    }: {
      defenceId: string;
      payload: SetDefenceSchedulePayload;
    }) => setDefenceSchedule(defenceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-defence-detail', variables.defenceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-defence-scheduling', variables.defenceId],
      });
    },
  });
}
