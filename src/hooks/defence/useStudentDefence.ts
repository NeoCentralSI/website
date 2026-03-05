import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentDefenceOverview,
  getDefenceDocumentTypes,
  getStudentDefenceDocuments,
  uploadDefenceDocument,
} from '@/services/studentDefence.service';
import { toast } from 'sonner';

const defenceKeys = {
  all: ['student-defence'] as const,
  overview: () => [...defenceKeys.all, 'overview'] as const,
  documentTypes: () => [...defenceKeys.all, 'document-types'] as const,
  documents: () => [...defenceKeys.all, 'documents'] as const,
};

export function useStudentDefenceOverview() {
  return useQuery({
    queryKey: defenceKeys.overview(),
    queryFn: getStudentDefenceOverview,
  });
}

export function useDefenceDocumentTypes() {
  return useQuery({
    queryKey: defenceKeys.documentTypes(),
    queryFn: getDefenceDocumentTypes,
  });
}

export function useStudentDefenceDocuments() {
  return useQuery({
    queryKey: defenceKeys.documents(),
    queryFn: getStudentDefenceDocuments,
  });
}

export function useUploadDefenceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, documentTypeName }: { file: File; documentTypeName: string }) =>
      uploadDefenceDocument(file, documentTypeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.documents() });
      queryClient.invalidateQueries({ queryKey: defenceKeys.overview() });
      toast.success('Dokumen berhasil diupload');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupload dokumen');
    },
  });
}
