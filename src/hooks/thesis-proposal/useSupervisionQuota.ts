import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as service from '@/services/thesis-proposal/supervision-quota.service';
import type { SupervisionLimits } from '@/types/thesis-proposal.types';

export const supervisionQuotaKeys = {
  all: ['supervision-quotas'] as const,
  overview: (academicYearId?: string) => ['supervision-quotas', 'overview', academicYearId ?? 'operational'] as const,
  mine: () => ['supervision-quotas', 'me'] as const,
};

export function useSupervisionLoadOverview(academicYearId?: string) {
  return useQuery({
    queryKey: supervisionQuotaKeys.overview(academicYearId),
    queryFn: () => service.getLoadOverview(academicYearId),
    placeholderData: (previous) => previous,
  });
}

export function useMySupervisionLoad(enabled = true) {
  return useQuery({ queryKey: supervisionQuotaKeys.mine(), queryFn: service.getMyLoad, enabled });
}

function useLimitAction<TArgs>(fn: (args: TArgs) => Promise<{ message?: string }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      if (result.message) toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: supervisionQuotaKeys.all });
      queryClient.invalidateQueries({ queryKey: ['thesis-proposal'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSetGeneralLimits() {
  return useLimitAction((limits: SupervisionLimits) => service.setGeneralLimits(limits));
}

export function useSetPeriodLimits() {
  return useLimitAction(({ academicYearId, limits }: { academicYearId: string; limits: Pick<SupervisionLimits, 'semesterQuota'> }) =>
    service.setPeriodLimits(academicYearId, limits));
}

export function useClearPeriodLimits() {
  return useLimitAction((academicYearId: string) => service.clearPeriodLimits(academicYearId));
}

export function useSetAcceptingRequests() {
  return useLimitAction((accepting: boolean) => service.setAcceptingRequests(accepting));
}
