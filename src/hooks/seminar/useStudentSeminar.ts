import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentSeminarOverview,
  getStudentAttendanceHistory,
  getSeminarDocumentTypes,
  getStudentSeminarDocuments,
  uploadSeminarDocument,
  getSeminarAnnouncements,
  registerToSeminar,
  cancelSeminarRegistration,
} from '@/services/studentSeminar.service';
import { toast } from 'sonner';

const seminarKeys = {
  all: ['student-seminar'] as const,
  overview: () => [...seminarKeys.all, 'overview'] as const,
  attendance: () => [...seminarKeys.all, 'attendance'] as const,
  documentTypes: () => [...seminarKeys.all, 'document-types'] as const,
  documents: () => [...seminarKeys.all, 'documents'] as const,
  announcements: () => [...seminarKeys.all, 'announcements'] as const,
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

export function useSeminarAnnouncements() {
  return useQuery({
    queryKey: seminarKeys.announcements(),
    queryFn: getSeminarAnnouncements,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRegisterToSeminar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seminarId: string) => registerToSeminar(seminarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seminarKeys.announcements() });
      queryClient.invalidateQueries({ queryKey: seminarKeys.attendance() });
      toast.success('Berhasil mendaftar sebagai peserta seminar');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mendaftar seminar');
    },
  });
}

export function useCancelSeminarRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seminarId: string) => cancelSeminarRegistration(seminarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seminarKeys.announcements() });
      queryClient.invalidateQueries({ queryKey: seminarKeys.attendance() });
      toast.success('Pendaftaran seminar berhasil dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan pendaftaran');
    },
  });
}
