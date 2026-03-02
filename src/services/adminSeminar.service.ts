import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AdminSeminarListItem,
  AdminSeminarDetailResponse,
  ValidateDocumentPayload,
  ValidateDocumentResponse,
} from '@/types/seminar.types';

/**
 * Get all seminars for admin list view
 */
export async function getAdminSeminarList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminSeminarListItem[]> {
  let endpoint = API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.LIST;
  const queryParts: string[] = [];
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (queryParts.length > 0) endpoint += `?${queryParts.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar');
  return json.data;
}

/**
 * Get seminar detail for admin
 */
export async function getAdminSeminarDetail(
  seminarId: string
): Promise<AdminSeminarDetailResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.DETAIL(seminarId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail seminar');
  return json.data;
}

/**
 * Validate (approve/decline) a seminar document
 */
export async function validateSeminarDocument(
  seminarId: string,
  documentTypeId: string,
  payload: ValidateDocumentPayload
): Promise<ValidateDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(
      API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.VALIDATE_DOCUMENT(
        seminarId,
        documentTypeId
      )
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi dokumen');
  return json.data;
}
