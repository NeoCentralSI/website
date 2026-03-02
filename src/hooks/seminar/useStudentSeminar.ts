import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentSeminarOverview,
  getStudentAttendanceHistory,
  getSeminarDocumentTypes,
  getStudentSeminarDocuments,
  uploadSeminarDocument,
} from '@/services/studentSeminar.service';
import { toast } from 'sonner';

const seminarKeys = {
  all: ['student-seminar'] as const,
  overview: () => [...seminarKeys.all, 'overview'] as const,
  attendance: () => [...seminarKeys.all, 'attendance'] as const,
  documentTypes: () => [...seminarKeys.all, 'document-types'] as const,
  documents: () => [...seminarKeys.all, 'documents'] as const,
};

export function useStudentSeminarOverview() {
  return useQuery({
    queryKey: seminarKeys.overview(),
    queryFn: getStudentSeminarOverview,
  });
}

export function useStudentAttendanceHistory() {
  return useQuery({
    queryKey: seminarKeys.attendance(),
    queryFn: getStudentAttendanceHistory,
  });
}

export function useSeminarDocumentTypes() {
  return useQuery({
    queryKey: seminarKeys.documentTypes(),
    queryFn: getSeminarDocumentTypes,
  });
}

export function useStudentSeminarDocuments() {
  return useQuery({
    queryKey: seminarKeys.documents(),
    queryFn: getStudentSeminarDocuments,
  });
}

export function useUploadSeminarDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, documentTypeName }: { file: File; documentTypeName: string }) =>
      uploadSeminarDocument(file, documentTypeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seminarKeys.documents() });
      queryClient.invalidateQueries({ queryKey: seminarKeys.overview() });
      toast.success('Dokumen berhasil diupload');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupload dokumen');
    },
  });
}
