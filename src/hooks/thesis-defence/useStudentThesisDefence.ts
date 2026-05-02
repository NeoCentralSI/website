import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getStudentDefenceOverview,
  getStudentDefenceHistory,
} from '@/services/thesis-defence/student.service';
import {
  getStudentDefenceDetail,
  getStudentDefenceAssessment,
} from '@/services/thesis-defence/core.service';
import {
  getDefenceDocumentTypes,
  getStudentDefenceDocuments,
  uploadDefenceDocument,
} from '@/services/thesis-defence/doc.service';
import {
  getStudentDefenceRevisions,
  createDefenceRevision,
  saveDefenceRevisionAction,
  submitDefenceRevision,
  submitDefenceRevisionAction,
  cancelDefenceRevisionSubmit,
  deleteDefenceRevision,
} from '@/services/thesis-defence/revision.service';
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
  documentTypes: () => [...defenceKeys.all, 'document-types'] as const,
  documents: (defenceId?: string) => [...defenceKeys.all, 'documents', defenceId] as const,
};

// ============================================================
// Overview / History
// ============================================================

export function useStudentDefenceOverview() {
  return useQuery({
    queryKey: defenceKeys.overview(),
    queryFn: getStudentDefenceOverview,
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

// ============================================================
// Documents (active-defence-aware)
// ============================================================

export function useDefenceDocumentTypes() {
  return useQuery({
    queryKey: defenceKeys.documentTypes(),
    queryFn: getDefenceDocumentTypes,
  });
}

export function useStudentDefenceDocuments() {
  const { data: overview } = useStudentDefenceOverview();
  const defenceId = overview?.defence?.id;

  return useQuery({
    queryKey: defenceKeys.documents(defenceId),
    queryFn: () => getStudentDefenceDocuments(defenceId!),
    enabled: !!defenceId,
  });
}

export function useUploadDefenceDocument() {
  const queryClient = useQueryClient();
  const { data: overview } = useStudentDefenceOverview();
  const defenceId = overview?.defence?.id;

  return useMutation({
    mutationFn: ({ file, documentTypeName }: { file: File; documentTypeName: string }) => {
      return uploadDefenceDocument(file, documentTypeName, defenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.documents(defenceId) });
      queryClient.invalidateQueries({ queryKey: defenceKeys.overview() });
      toast.success('Dokumen berhasil diupload');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupload dokumen');
    },
  });
}

// ============================================================
// Revisions (per-defence)
// ============================================================

export function useStudentDefenceRevisions(defenceId?: string) {
  return useQuery({
    queryKey: defenceKeys.revisions(defenceId),
    queryFn: () => getStudentDefenceRevisions(defenceId!),
    enabled: !!defenceId,
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
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
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
    mutationFn: ({ revisionId, payload }: { revisionId: string; payload: SaveDefenceRevisionActionPayload }) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return saveDefenceRevisionAction(defenceId, revisionId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
      toast.success('Perbaikan berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyimpan perbaikan');
    },
  });
}

export function useSubmitDefenceRevision(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (revisionId: string) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return submitDefenceRevision(defenceId, revisionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
      toast.success('Perbaikan berhasil diajukan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengajukan perbaikan');
    },
  });
}

export function useSubmitDefenceRevisionAction(defenceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ revisionId, payload }: { revisionId: string; payload: SaveDefenceRevisionActionPayload }) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return submitDefenceRevisionAction(defenceId, revisionId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
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
    mutationFn: (revisionId: string) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return cancelDefenceRevisionSubmit(defenceId, revisionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
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
    mutationFn: (revisionId: string) => {
      if (!defenceId) throw new Error('ID sidang tidak valid');
      return deleteDefenceRevision(defenceId, revisionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defenceKeys.revisions(defenceId) });
      queryClient.invalidateQueries({ queryKey: ['defence-revision-board', defenceId] });
      toast.success('Item revisi berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus item revisi');
    },
  });
}

// ============================================================
// Active-defence helpers (current = student's active defence)
// ============================================================

export function useCurrentStudentDefenceRevisions() {
  const { data: overview } = useStudentDefenceOverview();
  const defenceId = overview?.defence?.id;

  return useQuery({
    queryKey: defenceKeys.revisions(defenceId),
    queryFn: () => getStudentDefenceRevisions(defenceId!),
    enabled: !!defenceId,
  });
}

export function useCreateCurrentDefenceRevision() {
  const { data: overview } = useStudentDefenceOverview();
  const defenceId = overview?.defence?.id;
  return useCreateDefenceRevision(defenceId);
}

export function useSubmitCurrentDefenceRevisionAction() {
  const { data: overview } = useStudentDefenceOverview();
  const defenceId = overview?.defence?.id;
  return useSubmitDefenceRevisionAction(defenceId);
}
