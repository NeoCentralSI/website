import { getApiUrl } from '@/config/api';

/** One academic record as SIA sends it (`GET /students`, K45). */
export interface SiaCourse {
  code?: string;
  name?: string;
  credits?: number;
}

export interface SiaCplScore {
  cplCode?: string;
  /** Earlier name of `cplCode`. */
  code?: string;
  description?: string | null;
  score: number;
  inputAt: string;
}

export interface SiaStudent {
  nim: string;
  name: string;
  enrollmentYear?: number;
  studentStatus?: string;
  currentSemester?: number;
  sksCompleted: number;
  gpa?: number;
  internshipCompleted?: boolean;
  currentCourses?: SiaCourse[];
  cplScores?: SiaCplScore[];
}

/** `GET /sia/sync/status`: the last sync and how many students have flags for the running semester. */
export interface SiaSyncStatus {
  /** False while SIA_BASE_URL is empty: every SIA read is refused ("Sinkronisasi SIA belum tersedia."). */
  configured?: boolean;
  lastRun: string | null;
  /** The semester SIA's data is about, e.g. "2026/2027 ganjil". */
  period?: string;
  fetched?: number | string;
  notFound?: number | string;
  dbUpdated?: number | string;
  statusChanged?: number | string;
  gpaChanged?: number | string;
  failedStudents?: number | string;
  periodFlagsCreated?: number | string;
  periodFlagsUpdated?: number | string;
  periodFlagsKeptAdmin?: number | string;
  /** Records whose semester flags were not written because SIA's period is another semester. */
  periodFlagsSkipped?: number | string;
  periodMismatch?: string;
  periodFlagsError?: string | null;
  cplCreated?: number | string;
  cplUpdated?: number | string;
  error?: string | null;
  durationMs?: number | string;
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
