import { useQuery } from "@tanstack/react-query";

import { advisorRequestService } from "@/services/advisorRequest.service";

export function useAdvisorAccessState(enabled = true) {
  return useQuery({
    queryKey: ["advisor-access-state"],
    queryFn: async () => {
      const response = await advisorRequestService.getAccessState();
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}
