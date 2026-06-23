import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';
import type { MonitoringResponse } from '@/types/metopenMonitoring.types';

const E = API_CONFIG.ENDPOINTS.ASSESSMENT;

// ── Types ────────────────────────────────────────────────────────────

export interface AssessmentCriteriaItem {
  id: string;
  code?: string;
  name: string | null;
  maxWeight?: number;
  maxScore: number | null;
  displayOrder: number;
  description?: string;
  cpmk: { id: string; code: string; description: string } | null;
  assessmentRubrics: AssessmentRubricItem[];
}

export interface AssessmentRubricItem {
  id: string;
  minScore: number;
  maxScore: number;
  description: string;
  displayOrder: number;
}

export type RubricCriteriaItem = AssessmentCriteriaItem;

export interface ScoreSubmissionDto {
  scores: Array<{
    criteriaId: string;
    rubricId?: string;
    score: number;
  }>;
}

export interface ScoringQueueItem {
  thesisId: string;
  studentName: string;
  studentNim: string;
  proposedTitle: string;
  supervisorName?: string;
  supervisorScore?: number | null;
  existingScore?: number | null;
  isScored: boolean;
}

/**
 * BR-20: Antrean penilaian TA-03A untuk dosen pembimbing.
 * Per item membawa konteks role aktor (P1 atau P2) + status aksi yang perlu
 * dilakukan. Surface ini menggabungkan P1 (master pengisi) + P2 (co-sign)
 * supaya konsensus mufakat tetap satu jendela navigasi.
 */
export type Ta03AActionStatus =
  | 'p1_pending'        // P1: input rubrik
  | 'p1_waiting_cosign' // P1: sudah submit, menunggu P2 co-sign / TA-03B / finalize
  | 'p2_pending_cosign' // P2: P1 sudah submit, perlu co-sign konsensus
  | 'p2_waiting_p1'     // P2: menunggu P1 submit dulu
  | 'auto_zeroed'       // BR-28: presensi <75% (immutable, no manual input)
  | 'finalized';        // Siklus TA-03 final dan read-only di riwayat

export interface SupervisorScoringQueueItem {
  thesisId: string;
  thesisTitle: string | null;
  student: {
    id?: string | null;
    fullName?: string | null;
    identityNumber?: string | null;
  } | null;
  actorRole: 'P1' | 'P2';
  actionStatus: Ta03AActionStatus;
  /** Nama partner pembimbing (P2 bila aktor P1, atau sebaliknya) — null jika thesis solo */
  partnerName: string | null;
  supervisorScore: number | null;
  lecturerScore: number | null;
  finalScore: number | null;
  coSignedAt: string | null;
  attendanceAutoZeroedAt: string | null;
  attendanceAutoZeroReason: string | null;
}

export interface SupervisorScoringHistoryItem extends SupervisorScoringQueueItem {
  isFinalized: boolean;
  finalizedAt: string | null;
  coSignNote?: string | null;
}

export interface ResearchMethodScoreResult {
  id: string;
  thesisId: string;
  supervisorId?: string | null;
  supervisorScore?: number | null;
  lecturerId?: string | null;
  lecturerScore?: number | null;
  finalScore?: number | null;
  isFinalized?: boolean;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
  calculatedAt?: string | null;
  /** BR-20: identitas Pembimbing 2 yang melakukan co-sign (lecturerId) */
  coSignedByLecturerId?: string | null;
  coSignedAt?: string | null;
  coSignNote?: string | null;
  attendanceRecordId?: string | null;
  attendanceAutoZeroedAt?: string | null;
  attendanceAutoZeroReason?: string | null;
}

export interface ResearchMethodScoreDetailItem {
  assessmentCriteriaId: string;
  assessmentRubricId?: string | null;
  score: number;
  criteria?: {
    id: string;
    name?: string | null;
    maxScore?: number | null;
    /** Pembeda form: 'supervisor' = TA-03A, 'default' = TA-03B. */
    role?: string | null;
    displayOrder?: number | null;
    cpmk?: { code?: string | null; description?: string | null } | null;
  } | null;
  assessmentRubric?: {
    id: string;
    minScore: number;
    maxScore: number;
    description?: string | null;
  } | null;
}

export interface ResearchMethodScoreWithDetails extends ResearchMethodScoreResult {
  researchMethodScoreDetails?: ResearchMethodScoreDetailItem[];
  coSigner?: {
    id: string;
    user?: { id: string; fullName?: string | null } | null;
  } | null;
  attendanceRecord?: MetopenAttendanceRecord | null;
}

export type MetopenAttendanceEligibilityStatus =
  | 'missing_import'
  | 'not_found'
  | 'eligible'
  | 'ineligible';

export interface MetopenAttendanceRecord {
  id: string;
  studentId?: string | null;
  identityNumber: string;
  studentName?: string | null;
  presentCount: number;
  absentCount?: number;
  sickCount?: number;
  permitCount?: number;
  totalMeetings: number;
  attendancePercentage: number;
  isEligible: boolean;
  import?: {
    id: string;
    classCode?: string | null;
    courseName?: string | null;
    semesterLabel?: string | null;
    thresholdPercent: number;
    uploadedAt: string;
  } | null;
}

export interface MetopenAttendanceImportSummary {
  id: string;
  academicYearId?: string | null;
  documentId?: string | null;
  classCode?: string | null;
  courseName?: string | null;
  semesterLabel?: string | null;
  filterLabel?: string | null;
  lecturerNames?: string[] | null;
  thresholdPercent: number;
  totalRows: number;
  matchedRows: number;
  eligibleRows: number;
  ineligibleRows: number;
  autoZeroedCount: number;
  skippedFinalizedCount: number;
  uploadedAt: string;
  document?: {
    id: string;
    fileName?: string | null;
    filePath?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
  } | null;
  uploadedBy?: {
    id: string;
    fullName?: string | null;
    identityNumber?: string | null;
  } | null;
  ineligibleSamples?: MetopenAttendanceRecord[];
}

export interface MetopenAttendanceEligibility {
  status: MetopenAttendanceEligibilityStatus;
  isEligible: boolean;
  thresholdPercent: number;
  attendancePercentage?: number | null;
  presentCount?: number | null;
  totalMeetings?: number | null;
  import?: MetopenAttendanceImportSummary | null;
  record?: MetopenAttendanceRecord | null;
  message: string;
}

export interface MetopenAttendanceUploadResult {
  import: MetopenAttendanceImportSummary;
  totals: {
    totalRows: number;
    matchedRows: number;
    unmatchedRows: number;
    eligibleRows: number;
    ineligibleRows: number;
    autoZeroedCount: number;
    skippedFinalizedCount: number;
  };
  unmatchedRows: Array<{
    identityNumber: string;
    studentName?: string | null;
    attendancePercentage: number;
  }>;
  autoZeroedTheses: Array<{
    thesisId: string;
    thesisTitle?: string | null;
    studentId: string;
    identityNumber: string;
    studentName?: string | null;
    attendancePercentage: number;
  }>;
}

/** F-4.2: hasil dry-run pratinjau presensi sebelum commit (tidak menulis DB). */
export interface MetopenAttendanceImpactTarget {
  identityNumber: string;
  studentName?: string | null;
  attendancePercentage: number;
  thesisTitle?: string | null;
}

export interface MetopenAttendancePreviewResult {
  metadata: {
    classCode?: string | null;
    courseName?: string | null;
    semesterLabel?: string | null;
  } | null;
  thresholdPercent: number;
  totals: {
    totalRows: number;
    matchedRows: number;
    unmatchedRows: number;
    eligibleRows: number;
    ineligibleRows: number;
    willAutoZeroCount: number;
    willSkipFinalizedCount: number;
  };
  willAutoZero: MetopenAttendanceImpactTarget[];
  willSkipFinalized: MetopenAttendanceImpactTarget[];
  unmatchedRows: Array<{
    identityNumber: string;
    studentName?: string | null;
    attendancePercentage: number;
  }>;
}

export interface MetopenScoringHistoryItem extends ScoringQueueItem {
  finalScore: number | null;
  isFinalized: boolean;
  finalizedAt: string | null;
  coSignedAt: string | null;
  attendanceAutoZeroedAt: string | null;
  attendanceAutoZeroReason: string | null;
}

/**
 * BR-20: Klasifikasi role pembimbing yang sedang membuka card.
 * - P1 → form full edit rubrik (master pengisi)
 * - P2 → read + tombol co-sign
 * - null → bukan pembimbing aktif (read-only summary)
 */
export interface SupervisorContext {
  role: 'P1' | 'P2' | null;
  hasP2: boolean;
}

type QueueApiItem = {
  thesisId: string;
  thesisTitle?: string | null;
  student?: {
    id?: string | null;
    fullName?: string | null;
    identityNumber?: string | null;
  } | null;
  supervisorName?: string | null;
  supervisorScore?: number | null;
  lecturerScore?: number | null;
};

type CriteriaApiResponse = {
  formCode: 'TA-03A' | 'TA-03B';
  criteria: RubricCriteriaItem[];
};

function mapQueueItem(
  item: QueueApiItem,
  scoreField: 'supervisorScore' | 'lecturerScore',
): ScoringQueueItem {
  const currentScore = item[scoreField] ?? null;
  return {
    thesisId: item.thesisId,
    studentName: item.student?.fullName ?? '-',
    studentNim: item.student?.identityNumber ?? '-',
    proposedTitle: item.thesisTitle ?? '-',
    supervisorName: item.supervisorName ?? undefined,
    supervisorScore: item.supervisorScore ?? null,
    existingScore: currentScore,
    isScored: currentScore != null,
  };
}

// ── Service ──────────────────────────────────────────────────────────

export const assessmentService = {
  // Get assessment criteria by form code (TA-03A or TA-03B)
  getCriteria: async (
    formCode: 'TA-03A' | 'TA-03B',
  ): Promise<RubricCriteriaItem[]> => {
    const res = await apiRequest(getApiUrl(E.CRITERIA(formCode)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat kriteria penilaian');
    }
    const json = await res.json() as { data: CriteriaApiResponse };
    return json.data.criteria;
  },

  // BR-20: Antrean penilaian TA-03A untuk dosen pembimbing (P1 + P2).
  // Mengembalikan item kaya konteks (actorRole, actionStatus, partnerName)
  // supaya halaman queue bisa menampilkan badge + filter per status tanpa
  // permintaan tambahan ke endpoint context.
  getSupervisorScoringQueue: async (): Promise<SupervisorScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SCORING_QUEUE));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat antrean penilaian TA-03A');
    }
    const json = await res.json() as { data: SupervisorScoringQueueItem[] };
    return json.data ?? [];
  },

  getSupervisorScoringHistory: async (): Promise<SupervisorScoringHistoryItem[]> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SCORING_HISTORY));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat riwayat penilaian TA-03A');
    }
    const json = await res.json() as { data: SupervisorScoringHistoryItem[] };
    return json.data ?? [];
  },

  // Supervisor: submit TA-03A scores (Pembimbing 1 master)
  submitSupervisorScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  // BR-20: Pembimbing 2 co-sign endpoint
  coSignSupervisorScore: async (
    thesisId: string,
    note?: string | null,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_CO_SIGN(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note ?? null }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal melakukan co-sign');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  // BR-20: ambil klasifikasi role caller untuk thesis tertentu
  getSupervisorContext: async (thesisId: string): Promise<SupervisorContext> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_CONTEXT(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat konteks pembimbing');
    }
    const json = await res.json() as { data: SupervisorContext };
    return json.data;
  },

  // BR-20: ambil score detail (termasuk co-sign + per-CPMK detail)
  getSupervisorScoreDetail: async (
    thesisId: string,
  ): Promise<ResearchMethodScoreWithDetails | null> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_GET_SCORE(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat detail penilaian');
    }
    const json = await res.json() as { data: ResearchMethodScoreWithDetails | null };
    return json.data;
  },

  // Metopen Lecturer: get queue (TA-03B)
  getMetopenScoringQueue: async (): Promise<ScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SCORING_QUEUE));
    if (!res.ok) throw new Error('Gagal memuat antrian penilaian Metopen');
    const json = await res.json();
    return (json.data as QueueApiItem[]).map((item) =>
      mapQueueItem(item, 'lecturerScore'),
    );
  },

  getMetopenScoringHistory: async (): Promise<MetopenScoringHistoryItem[]> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SCORING_HISTORY));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat riwayat penilaian TA-03B');
    }
    const json = await res.json() as { data: Array<QueueApiItem & Omit<MetopenScoringHistoryItem, keyof ScoringQueueItem>> };
    return (json.data ?? []).map((item) => ({
      ...mapQueueItem(item, 'lecturerScore'),
      finalScore: item.finalScore ?? null,
      isFinalized: item.isFinalized ?? false,
      finalizedAt: item.finalizedAt ?? null,
      coSignedAt: item.coSignedAt ?? null,
      attendanceAutoZeroedAt: item.attendanceAutoZeroedAt ?? null,
      attendanceAutoZeroReason: item.attendanceAutoZeroReason ?? null,
    }));
  },

  getMetopenAttendanceLatest: async (): Promise<MetopenAttendanceImportSummary | null> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_ATTENDANCE_LATEST));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat presensi Metopel terbaru');
    }
    const json = await res.json() as { data: MetopenAttendanceImportSummary | null };
    return json.data;
  },

  /** F-4.2: dry-run pratinjau dampak auto-zero (permanen) sebelum commit. */
  previewMetopenAttendance: async (file: File): Promise<MetopenAttendancePreviewResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiRequest(getApiUrl(E.METOPEN_ATTENDANCE_PREVIEW), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memproses pratinjau presensi Metopel');
    }
    const json = await res.json() as { data: MetopenAttendancePreviewResult };
    return json.data;
  },

  uploadMetopenAttendance: async (file: File): Promise<MetopenAttendanceUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiRequest(getApiUrl(E.METOPEN_ATTENDANCE_UPLOAD), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal mengunggah presensi Metopel');
    }
    const json = await res.json() as { data: MetopenAttendanceUploadResult };
    return json.data;
  },

  getMetopenAttendanceEligibility: async (thesisId: string): Promise<MetopenAttendanceEligibility> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_ATTENDANCE_ELIGIBILITY(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memeriksa presensi Metopel');
    }
    const json = await res.json() as { data: MetopenAttendanceEligibility };
    return json.data;
  },

  /**
   * Koordinator Metopen dashboard — list eligible Metopen + status pencarian
   * pembimbing + rincian nilai 4 bucket. Mirror semantik xlsx download tapi
   * dalam JSON untuk UI table interaktif.
   */
  getMetopenMonitoring: async (): Promise<MonitoringResponse> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_MONITORING));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat monitoring Metopen');
    }
    const json = await res.json() as { data: MonitoringResponse };
    return json.data;
  },

  // Metopen Lecturer: submit TA-03B scores
  submitMetopenScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian Metopen');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  getMetopenScoreDetail: async (
    thesisId: string,
  ): Promise<ResearchMethodScoreWithDetails | null> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SUBMIT_SCORE(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat detail penilaian TA-03B');
    }
    const json = await res.json() as { data: ResearchMethodScoreWithDetails | null };
    return json.data;
  },

  // Metopen Lecturer: publish final combined score
  publishFinalScore: async (thesisId: string): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_PUBLISH(thesisId)), {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal mempublikasikan nilai akhir');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * BR-28 (canon v2.2 §5.7.x): Download xlsx rekap nilai TA-03A + TA-03B kelas
   * Metopel dalam format Template SIA. Hanya Koordinator Matkul Metopen yang
   * berwenang. Tanpa `attendanceImportId` service pakai import terbaru.
   */
  downloadMetopenScoresXlsx: async (
    attendanceImportId?: string,
  ): Promise<void> => {
    const base = getApiUrl(E.METOPEN_SCORES_EXPORT);
    const url = attendanceImportId
      ? `${base}?attendanceImportId=${encodeURIComponent(attendanceImportId)}`
      : base;

    const res = await apiRequest(url, { method: 'GET' });
    if (!res.ok) {
      let message = 'Gagal mengunduh rekap nilai TA-03';
      try {
        const err = await res.json();
        if (err?.message) message = err.message as string;
      } catch {
        // Response bukan JSON (mis. 500 HTML) — pakai pesan default.
      }
      throw new Error(message);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') ?? '';
    const filename = extractFilenameFromContentDisposition(disposition)
      ?? `Nilai-TA-03-${new Date().toISOString().split('T')[0]}.xlsx`;

    const blobUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};

function extractFilenameFromContentDisposition(header: string): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];
  const bareMatch = header.match(/filename=([^;]+)/i);
  if (bareMatch?.[1]) return bareMatch[1].trim();
  return null;
}
