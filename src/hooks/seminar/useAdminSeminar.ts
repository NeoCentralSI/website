import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSeminarList,
  getAdminSeminarDetail,
  validateSeminarDocument,
} from '@/services/adminSeminar.service';
import type { ValidateDocumentPayload } from '@/types/seminar.types';

export function useAdminSeminarList(params?: {
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-seminars', params?.search, params?.status],
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
