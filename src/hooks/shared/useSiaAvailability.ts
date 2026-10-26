import { useQuery } from '@tanstack/react-query';

import { getSiaSyncStatus } from '@/services/sia.service';

/** Shown on every button that reads SIA while SIA_BASE_URL is empty (the backend refuses with the same text). */
export const SIA_NOT_AVAILABLE = 'Sinkronisasi SIA belum tersedia.';

/**
 * Whether SIA can be read (before the real SIA API exists, SIA_BASE_URL on
 * neocentral.dev is empty). Reads `configured` from GET /sia/sync/status (Admin). Until the answer
 * comes, the buttons stay usable; the backend refuses anyway.
 */
export function useSiaAvailability(enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['sia', 'sync-status'],
    queryFn: getSiaSyncStatus,
    enabled,
    staleTime: 60_000,
  });
  const configured = data ? data.configured !== false : true;
  return { configured, isLoading, reason: configured ? null : SIA_NOT_AVAILABLE, status: data ?? null };
}
