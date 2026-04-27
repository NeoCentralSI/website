import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSeminarList,
  getAdminSeminarDetail,
  validateSeminarDocument,
  getSchedulingData,
  setSchedule,
} from '@/services/thesis-seminar/admin.service';
import type { ValidateDocumentPayload, SetSchedulePayload } from '@/types/seminar.types';

export function useAdminSeminarList(params?: {
  search?: string;
  status?: string;
  view?: string;
}) {
  return useQuery({
    queryKey: ['admin-seminars', params?.search, params?.status, params?.view],
    queryFn: () => getAdminSeminarList(params),
  });
}

export function useAdminSeminarDetail(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['admin-seminar-detail', seminarId],
    queryFn: () => getAdminSeminarDetail(seminarId!),
    enabled: !!seminarId,
  });
}

export function useValidateSeminarDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      documentTypeId,
      payload,
    }: {
      seminarId: string;
      documentTypeId: string;
      payload: ValidateDocumentPayload;
    }) => validateSeminarDocument(seminarId, documentTypeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seminars'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-seminar-detail', variables.seminarId],
      });
    },
  });
}

export function useSchedulingData(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['admin-seminar-scheduling', seminarId],
    queryFn: () => getSchedulingData(seminarId!),
    enabled: !!seminarId,
  });
}

export function useSetSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      payload,
    }: {
      seminarId: string;
      payload: SetSchedulePayload;
    }) => setSchedule(seminarId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seminars'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-seminar-detail', variables.seminarId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-seminar-scheduling', variables.seminarId],
      });
    },
  });
}
