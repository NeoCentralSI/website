import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createAdminThesisSeminarArchive,
  deleteAdminThesisSeminarArchive,
  exportAdminThesisSeminarArchive,
  getAdminThesisSeminarArchiveList,
  getAdminThesisSeminarDetail,
  getAdminThesisSeminarLecturerOptions,
  getAdminThesisSeminarRoomOptions,
  getAdminThesisSeminarSchedulingData,
  getAdminThesisSeminarThesisOptions,
  getAdminThesisSeminarVerificationList,
  importAdminThesisSeminarArchive,
  setAdminThesisSeminarSchedule,
  finalizeAdminThesisSeminarSchedule,
  updateAdminThesisSeminarArchive,
  downloadInvitationLetter,
  cancelAdminThesisSeminar,
  type AdminThesisSeminarArchivePayload,
} from '@/services/thesis-seminar/core.service';
import {
  addAdminThesisSeminarAudience,
  exportAdminThesisSeminarAudiences,
  getAdminThesisSeminarAudienceStudentOptions,
  getAdminThesisSeminarAudiences,
  importAdminThesisSeminarAudiences,
  removeAdminThesisSeminarAudience,
  exportAdminThesisSeminarAudiencesPdf,
} from '@/services/thesis-seminar/audience.service';
import { verifySeminarDocument } from '@/services/thesis-seminar/doc.service';
import type { SetSchedulePayload, VerifyDocumentPayload } from '@/types/seminar.types';

export function useAdminThesisSeminarVerification(params?: {
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-thesis-seminar', 'verification', params?.search, params?.status],
    queryFn: () => getAdminThesisSeminarVerificationList(params),
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

export function useVerifyAdminThesisSeminarDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      documentTypeId,
      payload,
    }: {
      seminarId: string;
      documentTypeId: string;
      payload: VerifyDocumentPayload;
    }) => verifySeminarDocument(seminarId, documentTypeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'verification'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'scheduling', variables.seminarId] });
    },
  });
}

export function useFinalizeAdminThesisSeminarSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seminarId: string) => finalizeAdminThesisSeminarSchedule(seminarId),
    onSuccess: (_data, seminarId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', seminarId] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'scheduling', seminarId] });
    },
  });
}

export function useCancelAdminThesisSeminar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, cancelledReason }: { seminarId: string; cancelledReason?: string }) =>
      cancelAdminThesisSeminar(seminarId, cancelledReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thesis-seminar', 'detail', variables.seminarId] });
      toast.success('Seminar berhasil dibatalkan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membatalkan seminar');
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

export function useExportAdminThesisSeminarAudiencesPdf() {
  return useMutation({
    mutationFn: (seminarId: string) => exportAdminThesisSeminarAudiencesPdf(seminarId),
  });
}


export function useDownloadInvitationLetter() {
  return useMutation({
    mutationFn: ({ seminarId, nomorSurat }: { seminarId: string; nomorSurat?: string }) => downloadInvitationLetter(seminarId, nomorSurat),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Undangan-Seminar-Hasil.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Surat undangan berhasil diunduh');
    },
    onError: () => {
      toast.error('Gagal mengunduh surat undangan');
    }
  });
}
