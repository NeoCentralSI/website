import { getApiUrl } from '@/config/api';

export interface SiaCourse {
  code?: string;
  name?: string;
  credits?: number;
}

export interface SiaStudent {
  nim: string;
  name: string;
  sksCompleted: number;
  currentSemester?: number;
  currentSemesterCourses?: SiaCourse[];
  internshipCompleted?: boolean;
}

export interface MetopenSiaOperationRow {
  requestId?: string | null;
  thesisId?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  identityNumber?: string | null;
  takingThesisCourse?: boolean | null;
  requestStatus?: string | null;
  releaseReason?: string | null;
  periodClosed?: boolean;
  attendanceAutoZeroed?: boolean;
  finalScore?: number | null;
  academicYearId?: string | null;
}

export interface MetopenSiaOperations {
  activeYear: { id: string; label: string; year: string; semester: string } | null;
  sync: {
    lastRun: string | null;
    fetched: number;
    dbUpdated: number;
    error: string | null;
    durationMs: number;
  };
  coverage: {
    complete: boolean;
    coverageLabel?: string;
    studentsWithSnapshot: number;
    totalStudents: number;
    pendingCreate: number;
  } | null;
  waitingKrs: MetopenSiaOperationRow[];
  exceptions: MetopenSiaOperationRow[];
  missingAcademicYear: MetopenSiaOperationRow[];
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

export const getMetopenSiaOperations = async (): Promise<MetopenSiaOperations> => {
  const response = await fetch(getApiUrl('/sia/metopen-operations'), {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(errorData.message || 'Gagal memuat operasi Metopel/SIA');
  }
  const json = await response.json();
  return json.data as MetopenSiaOperations;
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

export const releaseWaitingKrsBooking = async (requestId: string) => {
  const response = await fetch(getApiUrl(`/sia/waiting-krs/${requestId}/release`), {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(errorData.message || 'Gagal melepas booking menunggu KRS TA');
  }
  return response.json();
};
