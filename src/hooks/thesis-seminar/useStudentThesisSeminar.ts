import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentSeminarOverview,
  getStudentAttendanceHistory,
  getSeminarAnnouncements,
  getStudentSeminarHistory,
} from '@/services/thesis-seminar/student.service';

import {
  getSeminarDocumentTypes,
  getStudentSeminarDocuments,
  uploadSeminarDocument,
} from '@/services/thesis-seminar/doc.service';

import {
  registerToSeminar,
  cancelSeminarRegistration,
} from '@/services/thesis-seminar/audience.service';

import {
  getStudentRevisions,
  createRevision,
  submitRevisionAction,
  saveRevisionAction,
  submitRevision,
  cancelRevisionSubmission,
  deleteRevision,
} from '@/services/thesis-seminar/revision.service';

import {
  getStudentSeminarDetail,
  getStudentSeminarAssessment,
} from '@/services/thesis-seminar/core.service';
import { toast } from 'sonner';
import type { CreateRevisionPayload, SubmitRevisionActionPayload, SaveRevisionActionPayload } from '@/types/seminar.types';

const seminarKeys = {
  all: ['student-seminar'] as const,
  overview: () => [...seminarKeys.all, 'overview'] as const,
  attendance: () => [...seminarKeys.all, 'attendance'] as const,
  documentTypes: () => [...seminarKeys.all, 'document-types'] as const,
  documents: () => [...seminarKeys.all, 'documents'] as const,
  announcements: () => [...seminarKeys.all, 'announcements'] as const,
  revisions: () => [...seminarKeys.all, 'revisions'] as const,
  history: () => [...seminarKeys.all, 'history'] as const,
  detail: (seminarId: string) => [...seminarKeys.all, 'detail', seminarId] as const,
};

// ============================================================
// Student — Overview & Attendance
// ============================================================

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

// ============================================================
// Student — Documents
// ============================================================

export function useSeminarDocumentTypes() {
  return useQuery({
    queryKey: seminarKeys.documentTypes(),
    queryFn: getSeminarDocumentTypes,
  });
}

export function useStudentSeminarDocuments() {
  const { data: overview } = useStudentSeminarOverview();
  const seminarId = overview?.seminar?.id;

  return useQuery({
    queryKey: seminarKeys.documents(),
    queryFn: () => getStudentSeminarDocuments(seminarId!),
    enabled: !!seminarId,
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

// ============================================================
// Student — Announcements & Registration
// ============================================================

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

// ============================================================
// Student — Revision Hooks
// ============================================================

export function useStudentRevisions(seminarId: string | undefined) {
  return useQuery({
    queryKey: [...seminarKeys.revisions(), seminarId],
    queryFn: () => getStudentRevisions(seminarId!),
    enabled: !!seminarId,
  });
}

export function useCreateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, payload }: { seminarId: string; payload: CreateRevisionPayload }) =>
      createRevision(seminarId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Item revisi berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan item revisi');
    },
  });
}

export function useSubmitRevisionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId, payload }: { seminarId: string; revisionId: string; payload: SubmitRevisionActionPayload }) =>
      submitRevisionAction(seminarId, revisionId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Perbaikan berhasil disubmit');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengsubmit perbaikan');
    },
  });
}

export function useSaveRevisionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId, payload }: { seminarId: string; revisionId: string; payload: SaveRevisionActionPayload }) =>
      saveRevisionAction(seminarId, revisionId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Perbaikan berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyimpan perbaikan');
    },
  });
}

export function useSubmitRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId }: { seminarId: string; revisionId: string }) =>
      submitRevision(seminarId, revisionId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Perbaikan berhasil diajukan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengajukan perbaikan');
    },
  });
}

export function useCancelRevisionSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId }: { seminarId: string; revisionId: string }) =>
      cancelRevisionSubmission(seminarId, revisionId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Pengajuan berhasil dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan pengajuan');
    },
  });
}

export function useDeleteRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId }: { seminarId: string; revisionId: string }) =>
      deleteRevision(seminarId, revisionId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [...seminarKeys.revisions(), vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', vars.seminarId] });
      toast.success('Item revisi berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus item revisi');
    },
  });
}

// ============================================================
// Student — History & Detail
// ============================================================

export function useStudentSeminarHistory() {
  return useQuery({
    queryKey: seminarKeys.history(),
    queryFn: getStudentSeminarHistory,
  });
}

export function useStudentSeminarDetail(seminarId: string | undefined) {
  return useQuery({
    queryKey: seminarKeys.detail(seminarId!),
    queryFn: () => getStudentSeminarDetail(seminarId!),
    enabled: !!seminarId,
  });
}

export function useStudentSeminarAssessment(seminarId: string | undefined) {
  return useQuery({
    queryKey: [...seminarKeys.all, 'assessment', seminarId] as const,
    queryFn: () => getStudentSeminarAssessment(seminarId!),
    enabled: !!seminarId,
  });
}
