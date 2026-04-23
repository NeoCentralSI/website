import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudentDefenceOverview,
  getDefenceDocumentTypes,
  getStudentDefenceDocuments,
  uploadDefenceDocument,
  getStudentDefenceHistory,
  getStudentDefenceDetail,
  getStudentDefenceAssessment,
  getStudentDefenceRevisions,
  getCurrentStudentDefenceRevisions,
  createDefenceRevision,
  createCurrentDefenceRevision,
  saveDefenceRevisionAction,
  submitDefenceRevisionAction,
  cancelDefenceRevisionSubmit,
  deleteDefenceRevision,
} from '@/services/thesis-defence/student-defence.service';
import { toast } from 'sonner';
import type {
  CreateDefenceRevisionPayload,
  SaveDefenceRevisionActionPayload,
} from '@/types/defence.types';

const defenceKeys = {
  all: ['student-defence'] as const,
  overview: () => [...defenceKeys.all, 'overview'] as const,
  history: () => [...defenceKeys.all, 'history'] as const,
  detail: (defenceId?: string) => [...defenceKeys.all, 'detail', defenceId] as const,
  assessment: (defenceId?: string) => [...defenceKeys.all, 'assessment', defenceId] as const,
  revisions: (defenceId?: string) => [...defenceKeys.all, 'revisions', defenceId] as const,
  revisionsCurrent: () => [...defenceKeys.all, 'revisions', 'current'] as const,
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

export function useStudentDefenceHistory() {
  return useQuery({
    queryKey: defenceKeys.history(),
    queryFn: getStudentDefenceHistory,
  });
}

export function useStudentDefenceDetail(defenceId?: string) {
  return useQuery({
    queryKey: defenceKeys.detail(defenceId),
    queryFn: () => getStudentDefenceDetail(defenceId),
    enabled: !!defenceId,
  });
}

export function useStudentDefenceAssessment(defenceId?: string) {
  return useQuery({
    queryKey: defenceKeys.assessment(defenceId),
    queryFn: () => getStudentDefenceAssessment(defenceId),
    enabled: !!defenceId,
  });
}

export function useStudentDefenceRevisions(defenceId?: string) {
  return useQuery({
    queryKey: defenceKeys.revisions(defenceId),
    queryFn: () => getStudentDefenceRevisions(defenceId),
    enabled: !!defenceId,
  });
}

export function useCurrentStudentDefenceRevisions() {
  return useQuery({
    queryKey: defenceKeys.revisionsCurrent(),
    queryFn: getCurrentStudentDefenceRevisions,
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

export function useCreateDefenceRevision(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDefenceRevisionPayload) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return createDefenceRevision(defenceId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Item revisi berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan item revisi');
    },
  });
}

export function useCreateCurrentDefenceRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDefenceRevisionPayload) => createCurrentDefenceRevision(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      queryClient.invalidateQueries({ queryKey: defenceKeys.overview() });
      toast.success('Item revisi berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan item revisi');
    },
  });
}

export function useSaveDefenceRevisionAction(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ revisionId, payload }: { revisionId: string; payload: SaveDefenceRevisionActionPayload }) =>
      saveDefenceRevisionAction(revisionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Perbaikan berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyimpan perbaikan');
    },
  });
}

export function useSubmitDefenceRevisionAction(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ revisionId, payload }: { revisionId: string; payload: SaveDefenceRevisionActionPayload }) =>
      submitDefenceRevisionAction(revisionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Perbaikan berhasil disubmit');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal submit perbaikan');
    },
  });
}

export function useSubmitCurrentDefenceRevisionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ revisionId, payload }: { revisionId: string; payload: SaveDefenceRevisionActionPayload }) =>
      submitDefenceRevisionAction(revisionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Perbaikan berhasil disubmit');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal submit perbaikan');
    },
  });
}

export function useCancelDefenceRevisionSubmit(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revisionId: string) => cancelDefenceRevisionSubmit(revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Submit perbaikan dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan submit');
    },
  });
}

export function useDeleteDefenceRevision(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revisionId: string) => deleteDefenceRevision(revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.all });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisionsCurrent() });
      toast.success('Item revisi berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus item revisi');
    },
  });
}
