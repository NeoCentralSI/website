import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-change-request/thesis-change-request.service';
import type {
  ChangeDecisionDto,
  SubmitChangeRequestDto,
  SubmitTransferDto,
} from '@/types/thesis-change-request.types';
import type { SupervisorPosition } from '@/lib/thesisLabels';

export const thesisChangeRequestKeys = {
  all: ['thesis-change-requests'] as const,
  context: (thesisId?: string) => ['thesis-change-requests', 'context', thesisId ?? 'mine'] as const,
  lecturer: () => ['thesis-change-requests', 'lecturer'] as const,
  department: (scope: string, search: string, page: number, pageSize: number) =>
    ['thesis-change-requests', 'department', scope, search, page, pageSize] as const,
  supervisorOptions: (position?: SupervisorPosition) => ['thesis-change-requests', 'supervisor-options', position ?? 'all'] as const,
};

export function useThesisChangeContext(thesisId?: string, enabled = true) {
  return useQuery({
    queryKey: thesisChangeRequestKeys.context(thesisId),
    queryFn: () => service.getThesisChangeContext(thesisId),
    enabled,
  });
}

export function useSupervisorOptions(position?: SupervisorPosition, enabled = true) {
  return useQuery({
    queryKey: thesisChangeRequestKeys.supervisorOptions(position),
    queryFn: () => service.getSupervisorOptions(position),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useLecturerChangeRequests() {
  return useQuery({ queryKey: thesisChangeRequestKeys.lecturer(), queryFn: service.getLecturerChangeRequests });
}

export function useDepartmentChangeRequests(params: { scope: 'pending' | 'history'; search: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: thesisChangeRequestKeys.department(params.scope, params.search, params.page, params.pageSize),
    queryFn: () => service.getDepartmentChangeRequests({ ...params, search: params.search || undefined }),
    placeholderData: (previous) => previous,
  });
}

/** A change may alter supervisors and titles, so every list that shows them is refreshed. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: thesisChangeRequestKeys.all });
    queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
    queryClient.invalidateQueries({ queryKey: ['student-detail'] });
    queryClient.invalidateQueries({ queryKey: ['my-thesis-detail'] });
    queryClient.invalidateQueries({ queryKey: ['kadep-quick-actions'] });
  };
}

function useChangeMutation<TVariables, TData extends { message?: string }>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  fallbackSuccess: string,
) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      toast.success(result.message || fallbackSuccess);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export const useSubmitChangeRequest = () =>
  useChangeMutation((dto: SubmitChangeRequestDto) => service.submitChangeRequest(dto), 'Pengajuan perubahan berhasil dikirim');

export const useSubmitTransfer = () =>
  useChangeMutation((dto: SubmitTransferDto) => service.submitTransfer(dto), 'Pengalihan mahasiswa berhasil diajukan');

export const useLecturerDecision = () =>
  useChangeMutation(
    ({ requestId, ...dto }: ChangeDecisionDto & { requestId: string }) => service.decideAsLecturer(requestId, dto),
    'Keputusan disimpan',
  );

export const useCancelChangeRequest = () =>
  useChangeMutation((requestId: string) => service.cancelChangeRequest(requestId), 'Pengajuan dibatalkan');

export const useKadepDecision = () =>
  useChangeMutation(
    ({ requestId, ...dto }: ChangeDecisionDto & { requestId: string }) => service.decideAsKadep(requestId, dto),
    'Keputusan disimpan',
  );

export const useKadepBatchDecision = () =>
  useChangeMutation(
    ({ batchId, ...dto }: ChangeDecisionDto & { batchId: string }) => service.decideBatchAsKadep(batchId, dto),
    'Keputusan disimpan',
  );
