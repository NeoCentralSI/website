import { getApiUrl } from '@/config/api';

export interface SiaCourse {
  code?: string;
  name?: string;
  credits?: number;
}

export interface SiaCplScore {
  code: string;
  description: string;
  score: number;
  inputAt: string;
}

export interface SiaStudent {
  nim: string;
  name: string;
  sksCompleted: number;
  currentSemester?: number;
  currentSemesterCourses?: SiaCourse[];
  internshipCompleted?: boolean;
  cplScores?: SiaCplScore[];
}

/** `GET /sia/sync/status`: the last sync and how many students have flags for the running semester. */
export interface SiaSyncStatus {
  lastRun: string | null;
  fetched?: number;
  dbUpdated?: number;
  periodSnapshotsCreated?: number;
  error?: string | null;
  durationMs?: number;
  periodSnapshots: {
    academicYear: { id: string; semester: string; year: string };
    totalStudents: number;
    studentsWithFlags: number;
    studentsWithoutFlags: number;
    takingResearchMethod: number;
    takingThesisCourse: number;
  } | null;
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
}

/** Admin-only roster dump (`GET /sia/cached`). Student eligibility must not call this. */
export const getCachedStudentsFromSia = async (): Promise<SiaStudent[]> => {
  const response = await fetch(getApiUrl('/sia/cached'), {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data SIA');
  }

  const json = await response.json();
  return json?.data || [];
};

export const getSiaSyncStatus = async (): Promise<SiaSyncStatus> => {
  const response = await fetch(getApiUrl('/sia/sync/status'), { method: 'GET', headers: authHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(errorData.message || 'Gagal memuat status sinkronisasi SIA');
  }
  const json = await response.json();
  return json.data as SiaSyncStatus;
};

export const triggerSiaSync = async () => {
  let response: Response;
  try {
    response = await fetch(getApiUrl('/sia/sync'), {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    throw new Error(
      'Gagal menghubungi server sinkronisasi SIA. Pastikan backend berjalan dan untuk UAT lokal SIA_MOCK=true.',
    );
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(errorData.message || `Gagal menjalankan sync SIA (HTTP ${response.status}).`);
  }
  return response.json();
};
