import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addAdminThesisSeminarAudience,
  createAdminThesisSeminarArchive,
  deleteAdminThesisSeminarArchive,
  downloadAdminThesisSeminarArchiveTemplate,
  downloadAdminThesisSeminarAudienceTemplate,
  exportAdminThesisSeminarArchive,
  exportAdminThesisSeminarAudiences,
  getAdminThesisSeminarArchiveList,
  getAdminThesisSeminarAudienceStudentOptions,
  getAdminThesisSeminarAudiences,
  getAdminThesisSeminarDetail,
  getAdminThesisSeminarLecturerOptions,
  getAdminThesisSeminarRoomOptions,
  getAdminThesisSeminarSchedulingData,
  getAdminThesisSeminarThesisOptions,
  getAdminThesisSeminarValidationList,
  importAdminThesisSeminarArchive,
  importAdminThesisSeminarAudiences,
  removeAdminThesisSeminarAudience,
  setAdminThesisSeminarSchedule,
  updateAdminThesisSeminarArchive,
  type AdminThesisSeminarArchivePayload,
} from '@/services/thesis-seminar/core.service';
import { validateAdminSeminarDocument } from '@/services/thesis-seminar/doc.service';
import type { SetSchedulePayload, ValidateDocumentPayload } from '@/types/seminar.types';

export function useAdminThesisSeminarValidation(params?: {
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'validation', params?.search, params?.status],
    queryFn: () => getAdminThesisSeminarValidationList(params),
  });
}

export function useAdminThesisSeminarArchive(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'archive', params?.page, params?.pageSize, params?.search, params?.status],
    queryFn: () => getAdminThesisSeminarArchiveList(params),
  });
}

export function useAdminThesisSeminarDetail(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'detail', seminarId],
    queryFn: () => getAdminThesisSeminarDetail(seminarId!),
    enabled: !!seminarId,
  });
}

export function useAdminThesisSeminarSchedulingData(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'scheduling', seminarId],
    queryFn: () => getAdminThesisSeminarSchedulingData(seminarId!),
    enabled: !!seminarId,
  });
}

export function useAdminThesisSeminarFormOptions() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-thesis-seminar', 'options', 'theses'],
        queryFn: getAdminThesisSeminarThesisOptions,
      },
      {
        queryKey: ['admin-thesis-seminar', 'options', 'lecturers'],
        queryFn: getAdminThesisSeminarLecturerOptions,
      },
      {
        queryKey: ['admin-thesis-seminar', 'options', 'rooms'],
        queryFn: getAdminThesisSeminarRoomOptions,
      },
    ],
  });

  return {
    thesisOptions: results[0].data ?? [],
    lecturerOptions: results[1].data ?? [],
    roomOptions: results[2].data ?? [],
    isLoading: results.some((result) => result.isLoading),
  };
}

export function useAdminThesisSeminarAudiences(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'audiences', seminarId],
    queryFn: () => getAdminThesisSeminarAudiences(seminarId!),
    enabled: !!seminarId,
  });
}

export function useAdminThesisSeminarAudienceStudentOptions(seminarId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'audience-options', seminarId],
    queryFn: () => getAdminThesisSeminarAudienceStudentOptions(seminarId!),
    enabled: !!seminarId && enabled,
  });
}

export function useValidateAdminThesisSeminarDocument() {
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
    }) => validateAdminSeminarDocument(seminarId, documentTypeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'validation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
    },
  });
}

export function useSetAdminThesisSeminarSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      payload,
    }: {
      seminarId: string;
      payload: SetSchedulePayload;
    }) => setAdminThesisSeminarSchedule(seminarId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'validation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'scheduling', variables.seminarId] });
    },
  });
}

export function useCreateAdminThesisSeminarArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminThesisSeminarArchivePayload) => createAdminThesisSeminarArchive(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'archive'] });
      toast.success('Arsip seminar berhasil ditambahkan');
    },
  });
}

export function useUpdateAdminThesisSeminarArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seminarId, payload }: { seminarId: string; payload: AdminThesisSeminarArchivePayload }) =>
      updateAdminThesisSeminarArchive(seminarId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'archive'] });
      toast.success('Arsip seminar berhasil diperbarui');
    },
  });
}

export function useDeleteAdminThesisSeminarArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seminarId: string) => deleteAdminThesisSeminarArchive(seminarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'archive'] });
      toast.success('Arsip seminar berhasil dihapus');
    },
  });
}

export function useImportAdminThesisSeminarArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importAdminThesisSeminarArchive(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'archive'] });
    },
  });
}

export function useExportAdminThesisSeminarArchive() {
  return useMutation({
    mutationFn: () => exportAdminThesisSeminarArchive(),
  });
}

export function useDownloadAdminThesisSeminarArchiveTemplate() {
  return useMutation({
    mutationFn: () => downloadAdminThesisSeminarArchiveTemplate(),
  });
}

export function useAddAdminThesisSeminarAudience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      addAdminThesisSeminarAudience(seminarId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audiences', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audience-options', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
    },
  });
}

export function useRemoveAdminThesisSeminarAudience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      removeAdminThesisSeminarAudience(seminarId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audiences', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audience-options', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
    },
  });
}

export function useImportAdminThesisSeminarAudiences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seminarId, file }: { seminarId: string; file: File }) =>
      importAdminThesisSeminarAudiences(seminarId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audiences', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'audience-options', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
    },
  });
}

export function useExportAdminThesisSeminarAudiences() {
  return useMutation({
    mutationFn: (seminarId: string) => exportAdminThesisSeminarAudiences(seminarId),
  });
}

export function useDownloadAdminThesisSeminarAudienceTemplate() {
  return useMutation({
    mutationFn: (seminarId: string) => downloadAdminThesisSeminarAudienceTemplate(seminarId),
  });
}
