import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentYudisiumOverview,
  getStudentYudisiumRequirements,
  uploadYudisiumDocument,
} from '@/services/studentYudisium.service';
import { toast } from 'sonner';

const studentYudisiumKeys = {
  all: ['student-yudisium'] as const,
  overview: () => [...studentYudisiumKeys.all, 'overview'] as const,
  requirements: () => [...studentYudisiumKeys.all, 'requirements'] as const,
};

export function useStudentYudisiumOverview() {
  return useQuery({
    queryKey: studentYudisiumKeys.overview(),
    queryFn: getStudentYudisiumOverview,
  });
}

export function useStudentYudisiumRequirements() {
  return useQuery({
    queryKey: studentYudisiumKeys.requirements(),
    queryFn: getStudentYudisiumRequirements,
  });
}

export function useUploadYudisiumDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, requirementId }: { file: File; requirementId: string }) =>
      uploadYudisiumDocument(file, requirementId),
    onSuccess: () => {
      toast.success('Dokumen berhasil diunggah');
      queryClient.invalidateQueries({ queryKey: studentYudisiumKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengunggah dokumen');
    },
  });
}
