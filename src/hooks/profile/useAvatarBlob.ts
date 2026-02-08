import { useQuery } from '@tanstack/react-query';
import { getAvatarUrl } from '@/services/profile.service';
import { apiRequest } from '@/services/auth.service';

/**
 * Fetch avatar via auth-protected endpoint and return a blob URL for <img> usage.
 * Since the avatar endpoint requires Authorization header, we can't use a regular <img src>.
 */
export function useAvatarBlob(avatarUrl: string | null | undefined) {
  const url = getAvatarUrl(avatarUrl);

  const { data: blobUrl } = useQuery({
    queryKey: ['avatar-blob', avatarUrl],
    queryFn: async () => {
      if (!url) return null;
      const response = await apiRequest(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return blobUrl || undefined;
}
