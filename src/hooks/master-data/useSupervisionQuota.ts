import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import {
  getDefaultQuotaAPI,
  setDefaultQuotaAPI,
  getLecturerQuotasAPI,
  getLecturerQuotaDetailAPI,
  updateLecturerQuotaAPI,
  recalculateQuotasAPI,
  checkLecturerQuotaAPI,
  type LecturerQuotaList,
  type QuotaAvailability,
  type SetDefaultQuotaRequest,
  type UpdateLecturerQuotaRequest,
} from '@/services/supervisionQuota.service';
import { toast } from 'sonner';

const KEYS = {
  defaultQuota: (ayId: string) => ['supervision-quota', 'default', ayId],
  lecturerQuotas: (ayId: string, search?: string) => ['supervision-quota', 'lecturers', ayId, search],
  lecturerQuotaDetail: (lecturerId: string, ayId: string) => [
    'supervision-quota',
    'lecturers',
    lecturerId,
    ayId,
    'detail',
  ],
};

export function useDefaultQuota(academicYearId: string | undefined) {
  return useQuery({
    queryKey: KEYS.defaultQuota(academicYearId ?? ''),
    queryFn: () => getDefaultQuotaAPI(academicYearId!),
    enabled: !!academicYearId,
  });
}

export function useSetDefaultQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ academicYearId, data }: { academicYearId: string; data: SetDefaultQuotaRequest }) =>
      setDefaultQuotaAPI(academicYearId, data),
    onSuccess: (res) => {
      const gen = res?.generated;
      const msg = gen
        ? `Default kuota berhasil disimpan. Diterapkan ke ${gen.total} dosen${gen.updated != null ? ` (${gen.created} baru, ${gen.updated} diperbarui)` : ''}.`
        : 'Default kuota berhasil disimpan';
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['supervision-quota'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan default kuota');
    },
  });
}

export function useLecturerQuotas(academicYearId: string | undefined, search?: string) {
  return useQuery<LecturerQuotaList, Error>({
    queryKey: KEYS.lecturerQuotas(academicYearId ?? '', search),
    queryFn: () => getLecturerQuotasAPI(academicYearId!, search),
    enabled: !!academicYearId,
  });
}

export function useLecturerQuotaDetail(
  lecturerId: string | undefined,
  academicYearId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: KEYS.lecturerQuotaDetail(lecturerId ?? '', academicYearId ?? ''),
    queryFn: () => getLecturerQuotaDetailAPI(lecturerId!, academicYearId!),
    enabled: enabled && !!lecturerId && !!academicYearId,
  });
}

export function useUpdateLecturerQuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lecturerId,
      academicYearId,
      data,
    }: {
      lecturerId: string;
      academicYearId: string;
      data: UpdateLecturerQuotaRequest;
    }) => updateLecturerQuotaAPI(lecturerId, academicYearId, data),
    onSuccess: () => {
      toast.success('Kuota dosen berhasil diperbarui');
      qc.invalidateQueries({ queryKey: ['supervision-quota'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengupdate kuota dosen');
    },
  });
}

export function useLecturerQuotaAvailability(lecturerIds: string[]) {
  const unique = [...new Set(lecturerIds.filter(Boolean))];
  const results = useQueries({
    queries: unique.map((lecturerId) => ({
      queryKey: ['quota-check', lecturerId],
      queryFn: () => checkLecturerQuotaAPI(lecturerId),
      retry: 1,
    })),
  });

  const byLecturerId = new Map<
    string,
    { availability?: QuotaAvailability; isLoading: boolean; isError: boolean }
  >();
  unique.forEach((lecturerId, index) => {
    const result = results[index];
    byLecturerId.set(lecturerId, {
      availability: result?.data,
      isLoading: Boolean(result?.isLoading),
      isError: Boolean(result?.isError),
    });
  });
  return byLecturerId;
}

export function useRecalculateQuotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (academicYearId: string) => recalculateQuotasAPI(academicYearId),
    onSuccess: (res) => {
      toast.success(
        res.repairedCount > 0
          ? `Penghitung kuota diperbaiki pada ${res.repairedCount} dari ${res.recalculated} dosen.`
          : `Penghitung kuota sudah sesuai untuk ${res.recalculated} dosen.`,
      );
      qc.invalidateQueries({ queryKey: ['supervision-quota'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghitung ulang kuota dosen');
    },
  });
}
