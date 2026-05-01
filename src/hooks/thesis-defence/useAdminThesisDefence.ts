import {
  getAdminDefenceList,
  getAdminDefenceDetail,
  getDefenceSchedulingData,
  setDefenceSchedule,
  getAdminDefenceArchiveList,
  createAdminDefenceArchive,
  updateAdminDefenceArchive,
  deleteAdminDefenceArchive,
  cancelAdminDefence,
  importAdminDefenceArchive,
  exportAdminDefenceArchive,
  getAdminDefenceThesisOptions,
  getAdminDefenceStudentOptions,
  getAdminDefenceLecturerOptions,
  getAdminDefenceRoomOptions,
} from '@/services/thesis-defence/core.service';
import { validateDefenceDocument } from '@/services/thesis-defence/doc.service';
import type {
  ValidateDefenceDocumentPayload,
  SetDefenceSchedulePayload,
  AdminDefenceArchivePayload,
} from '@/types/defence.types';
import { useQueries, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

export function useAdminDefenceArchive(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['admin-defences', 'archive', params?.page, params?.pageSize, params?.search, params?.status],
    queryFn: () => getAdminDefenceArchiveList(params),
  });
}

export function useAdminDefenceFormOptions() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-defences', 'options', 'theses'],
        queryFn: getAdminDefenceThesisOptions,
      },
      {
        queryKey: ['admin-defences', 'options', 'students'],
        queryFn: getAdminDefenceStudentOptions,
      },
      {
        queryKey: ['admin-defences', 'options', 'lecturers'],
        queryFn: getAdminDefenceLecturerOptions,
      },
      {
        queryKey: ['admin-defences', 'options', 'rooms'],
        queryFn: getAdminDefenceRoomOptions,
      },
    ],
  });

  return {
    thesisOptions: results[0].data ?? [],
    studentOptions: results[1].data ?? [],
    lecturerOptions: results[2].data ?? [],
    roomOptions: results[3].data ?? [],
    isLoading: results.some((result) => result.isLoading),
  };
}

export function useCreateAdminDefenceArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminDefenceArchivePayload) => createAdminDefenceArchive(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences', 'archive'] });
      toast.success('Arsip sidang berhasil ditambahkan');
    },
  });
}

export function useUpdateAdminDefenceArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ defenceId, payload }: { defenceId: string; payload: AdminDefenceArchivePayload }) =>
      updateAdminDefenceArchive(defenceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences', 'archive'] });
      toast.success('Arsip sidang berhasil diperbarui');
    },
  });
}

// Typo in core.service: updateAdminDefenceArchive was used instead of updateAdminThesisDefenceArchive
// Actually I named it updateAdminDefenceArchive in core.service.ts, so I should use that.

export function useDeleteAdminDefenceArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (defenceId: string) => deleteAdminDefenceArchive(defenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences', 'archive'] });
      toast.success('Arsip sidang berhasil dihapus');
    },
  });
}

export function useCancelAdminDefence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ defenceId, cancelledReason }: { defenceId: string; cancelledReason?: string }) =>
      cancelAdminDefence(defenceId, cancelledReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-defence-detail', variables.defenceId] });
      toast.success('Sidang berhasil dibatalkan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membatalkan sidang');
    },
  });
}

export function useImportAdminDefenceArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importAdminDefenceArchive(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-defences', 'archive'] });
      toast.success('Arsip sidang berhasil diimpor');
    },
  });
}

export function useExportAdminDefenceArchive() {
  return useMutation({
    mutationFn: () => exportAdminDefenceArchive(),
  });
}
