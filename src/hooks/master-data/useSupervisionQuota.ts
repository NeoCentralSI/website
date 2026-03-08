import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDefaultQuotaAPI,
  setDefaultQuotaAPI,
  getLecturerQuotasAPI,
  updateLecturerQuotaAPI,
  type SetDefaultQuotaRequest,
  type UpdateLecturerQuotaRequest,
} from '@/services/supervisionQuota.service';
import { toast } from 'sonner';

const KEYS = {
  defaultQuota: (ayId: string) => ['supervision-quota', 'default', ayId],
  lecturerQuotas: (ayId: string, search?: string) => ['supervision-quota', 'lecturers', ayId, search],
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
    onSuccess: () => {
      toast.success('Default kuota berhasil disimpan');
      qc.invalidateQueries({ queryKey: ['supervision-quota'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan default kuota');
    },
  });
}

export function useLecturerQuotas(academicYearId: string | undefined, search?: string) {
  return useQuery({
    queryKey: KEYS.lecturerQuotas(academicYearId ?? '', search),
    queryFn: () => getLecturerQuotasAPI(academicYearId!, search),
    enabled: !!academicYearId,
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
