import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AdminDefenceListItem,
  AdminDefenceDetailResponse,
  ValidateDefenceDocumentPayload,
  ValidateDefenceDocumentResponse,
} from '@/types/defence.types';

export async function getAdminDefenceList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminDefenceListItem[]> {
  let endpoint = API_CONFIG.ENDPOINTS.THESIS_DEFENCE_ADMIN.LIST;
  const queryParts: string[] = [];
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (queryParts.length > 0) endpoint += `?${queryParts.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data sidang');
  return json.data;
}

export async function getAdminDefenceDetail(defenceId: string): Promise<AdminDefenceDetailResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE_ADMIN.DETAIL(defenceId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail sidang');
  return json.data;
}

export async function validateDefenceDocument(
  defenceId: string,
  documentTypeId: string,
  payload: ValidateDefenceDocumentPayload
): Promise<ValidateDefenceDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(
      API_CONFIG.ENDPOINTS.THESIS_DEFENCE_ADMIN.VALIDATE_DOCUMENT(
        defenceId,
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
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi dokumen sidang');
  return json.data;
}
