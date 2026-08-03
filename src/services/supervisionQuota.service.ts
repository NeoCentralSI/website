import { getApiUrl } from '@/config/api';
import { getAuthTokens } from '@/services/auth.service';

// ==================== Types ====================

export interface SupervisionQuotaDefault {
  quotaMax: number;
  quotaSoftLimit: number;
  academicYearId: string;
}

export interface LecturerQuota {
  id: string | null;
  lecturerId: string;
  academicYearId: string;
  fullName: string;
  identityNumber: string;
  email: string | null;
  scienceGroup: string | null;
  quotaMax: number;
  quotaSoftLimit: number;
  currentCount: number;
  activeCount: number;
  bookingCount: number;
  pendingKadepCount: number;
  normalAvailable: number;
  overquotaAmount: number;
  overquotaSahCount: number;
  notes: string | null;
  remaining: number;
  isNearLimit: boolean;
  isFull: boolean;
}

export interface LecturerQuotaEntry {
  id: string;
  source: 'request' | 'supervisor';
  requestId: string | null;
  supervisorId: string | null;
  bucket: 'active' | 'booking' | 'pendingKadep';
  studentId: string | null;
  studentName: string;
  studentIdentityNumber: string;
  thesisId: string | null;
  thesisTitle: string | null;
  roleName: string | null;
  requestStatus: string | null;
  routeType: string | null;
  acceptedOverNormal: boolean;
  createdAt: string | null;
}

export interface LecturerQuotaDetail extends LecturerQuota {
  activeOfficialEntries: LecturerQuotaEntry[];
  bookingEntries: LecturerQuotaEntry[];
  pendingKadepEntries: LecturerQuotaEntry[];
  overquotaSahEntries: LecturerQuotaEntry[];
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
  const { accessToken } = getAuthTokens();
  const res = await fetch(getApiUrl(`/supervision-quota/default/${academicYearId}`), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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
): Promise<{ defaultQuota: SupervisionQuotaDefault; generated: { created: number; updated?: number; total: number } }> {
  const { accessToken } = getAuthTokens();
  const res = await fetch(getApiUrl(`/supervision-quota/default/${academicYearId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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
  const { accessToken } = getAuthTokens();
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const url = getApiUrl(`/supervision-quota/lecturers/${academicYearId}${params.toString() ? `?${params}` : ''}`);
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengambil data kuota dosen');
  }
  const json = await res.json();
  return json.data;
}

export async function getLecturerQuotaDetailAPI(
  lecturerId: string,
  academicYearId: string
): Promise<LecturerQuotaDetail> {
  const { accessToken } = getAuthTokens();
  const res = await fetch(
    getApiUrl(`/supervision-quota/lecturers/${lecturerId}/${academicYearId}`),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengambil rincian kuota dosen');
  }
  const json = await res.json();
  return json.data;
}

export async function updateLecturerQuotaAPI(
  lecturerId: string,
  academicYearId: string,
  data: UpdateLecturerQuotaRequest
): Promise<LecturerQuota> {
  const { accessToken } = getAuthTokens();
  const res = await fetch(
    getApiUrl(`/supervision-quota/lecturers/${lecturerId}/${academicYearId}`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
