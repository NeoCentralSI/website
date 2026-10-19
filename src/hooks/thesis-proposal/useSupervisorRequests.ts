import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-proposal/supervisor-request.service';
import type { LecturerInboxJenis } from '@/lib/thesisLabels';
import type { KadepDecisionDto, LecturerResponseDto, SupervisorRequestInput } from '@/types/thesis-proposal.types';

export const supervisorRequestKeys = {
  all: ['thesis-proposal', 'supervisor-requests'] as const,
  mine: () => ['thesis-proposal', 'supervisor-requests', 'mine'] as const,
  catalog: () => ['thesis-proposal', 'supervisor-requests', 'catalog'] as const,
  inbox: () => ['thesis-proposal', 'supervisor-requests', 'inbox'] as const,
  approvalInbox: (params: object) => ['thesis-proposal', 'lecturer-inbox', params] as const,
  kadep: () => ['thesis-proposal', 'supervisor-requests', 'kadep'] as const,
  recommendations: (id: string) => ['thesis-proposal', 'supervisor-requests', id, 'recommendations'] as const,
  assignable: (id: string) => ['thesis-proposal', 'supervisor-requests', id, 'assignable'] as const,
};

export function useMySupervisorRequests() {
  return useQuery({ queryKey: supervisorRequestKeys.mine(), queryFn: service.getMySupervisorRequests });
}

export function useSupervisorCatalog(enabled: boolean) {
  return useQuery({ queryKey: supervisorRequestKeys.catalog(), queryFn: service.getCatalog, enabled, staleTime: 60_000 });
}

export function useLecturerSupervisorInbox(enabled = true) {
  return useQuery({ queryKey: supervisorRequestKeys.inbox(), queryFn: service.getLecturerInbox, enabled });
}

/**
 * Tugas Akhir > Permohonan: a page of the lecturer's approval inbox from the server,
 * sorted by status priority; the old page stays while the next loads.
 */
export function useLecturerApprovalInbox(
  params: { kind?: LecturerInboxJenis; status?: string; search?: string; page: number; pageSize: number },
  enabled = true,
) {
  return useQuery({
    queryKey: supervisorRequestKeys.approvalInbox(params),
    queryFn: () => service.getLecturerApprovalInbox(params),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useKadepSupervisorQueue(enabled = true) {
  return useQuery({ queryKey: supervisorRequestKeys.kadep(), queryFn: service.getKadepQueue, enabled });
}

export function useRequestRecommendations(id: string | null) {
  return useQuery({
    queryKey: supervisorRequestKeys.recommendations(id ?? '-'),
    queryFn: () => service.getRecommendations(id as string),
    enabled: Boolean(id),
  });
}

export function useAssignableLecturers(id: string | null) {
  return useQuery({
    queryKey: supervisorRequestKeys.assignable(id ?? '-'),
    queryFn: () => service.getAssignableLecturers(id as string),
    enabled: Boolean(id),
  });
}

/** A decision changes supervisors and loads, so every list that shows them is refreshed. */
function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: supervisorRequestKeys.all });
    queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    queryClient.invalidateQueries({ queryKey: ['supervision-quotas'] });
    queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
    queryClient.invalidateQueries({ queryKey: ['my-thesis-detail'] });
    queryClient.invalidateQueries({ queryKey: ['kadep-quick-actions'] });
  };
}

function useAction<TArgs>(fn: (args: TArgs) => Promise<{ message?: string }>) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      if (result.message) toast.success(result.message);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSaveSupervisorRequestDraft() {
  return useAction((dto: SupervisorRequestInput) => service.saveDraft(dto));
}

export function useSubmitSupervisorRequest() {
  return useAction((dto: SupervisorRequestInput) => service.submitRequest(dto));
}

export function useWithdrawSupervisorRequest() {
  return useAction((id: string) => service.withdrawRequest(id));
}

export function useMarkSupervisorRequestUnderReview() {
  return useAction((id: string) => service.markUnderReview(id));
}

export function useRespondSupervisorRequest() {
  return useAction(({ id, dto }: { id: string; dto: LecturerResponseDto }) => service.respondAsLecturer(id, dto));
}

export function useKadepSupervisorDecision() {
  return useAction(({ id, dto }: { id: string; dto: KadepDecisionDto }) => service.decideAsKadep(id, dto));
}
