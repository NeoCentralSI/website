import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export const uploadAvatarAPI = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE.UPLOAD_AVATAR), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengunggah avatar');
  }

  const result = await response.json();
  return result.data;
};

export const deleteAvatarAPI = async (): Promise<void> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE.DELETE_AVATAR), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus avatar');
  }
};

/**
 * Build the full avatar URL for display.
 * The avatar is served via a protected endpoint that requires auth.
 */
export const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined;
  // avatarUrl from DB is like "/avatars/filename.jpg"
  // Served at GET /profile/avatar/:fileName
  const fileName = avatarUrl.split('/').pop();
  if (!fileName) return undefined;
  return getApiUrl(API_CONFIG.ENDPOINTS.PROFILE.SERVE_AVATAR(fileName));
};
