import { getApiUrl } from '@/config/api';

// ==================== Types ====================

export interface SupervisionQuotaDefault {
  quotaMax: number;
  quotaSoftLimit: number;
  academicYearId: string;
}

export interface LecturerQuota {
  id: string;
  lecturerId: string;
  fullName: string;
  identityNumber: string;
  email: string;
  scienceGroup: string | null;
  quotaMax: number;
  quotaSoftLimit: number;
  currentCount: number;
  notes: string | null;
  remaining: number;
  isNearLimit: boolean;
  isFull: boolean;
}

export interface SetDefaultQuotaRequest {
  quotaMax: number;
  quotaSoftLimit: number;
}

export interface UpdateLecturerQuotaRequest {
  quotaMax?: number;
  quotaSoftLimit?: number;
  notes?: string | null;
}

// ==================== API Functions ====================

export async function getDefaultQuotaAPI(academicYearId: string): Promise<SupervisionQuotaDefault> {
  const res = await fetch(getApiUrl(`/supervision-quota/default/${academicYearId}`), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengambil default kuota');
  }
  const json = await res.json();
  return json.data;
}

export async function setDefaultQuotaAPI(
  academicYearId: string,
  data: SetDefaultQuotaRequest
): Promise<{ defaultQuota: SupervisionQuotaDefault; generated: { created: number; total: number } }> {
  const res = await fetch(getApiUrl(`/supervision-quota/default/${academicYearId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menyimpan default kuota');
  }
  const json = await res.json();
  return json;
}

export async function getLecturerQuotasAPI(
  academicYearId: string,
  search?: string
): Promise<LecturerQuota[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const url = getApiUrl(`/supervision-quota/lecturers/${academicYearId}${params.toString() ? `?${params}` : ''}`);
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengambil data kuota dosen');
  }
  const json = await res.json();
  return json.data;
}

export async function updateLecturerQuotaAPI(
  lecturerId: string,
  academicYearId: string,
  data: UpdateLecturerQuotaRequest
): Promise<LecturerQuota> {
  const res = await fetch(
    getApiUrl(`/supervision-quota/lecturers/${lecturerId}/${academicYearId}`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengupdate kuota dosen');
  }
  const json = await res.json();
  return json.data;
}
