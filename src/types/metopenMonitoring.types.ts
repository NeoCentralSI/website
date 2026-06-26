/**
 * Tipe response dashboard Monitoring Koordinator Metopen.
 * Mirror backend `metopenMonitoring.service.js`.
 */

export type AdvisorStatusCategory =
  | "no_advisor"
  | "pending_review"
  | "pending_kadep"
  | "active_pre_ta04"
  | "active_official"
  | "revision"
  | "rejected"
  | "withdrawn"
  | "other";

export type ScoreCompleteness =
  | "none"
  | "partial_ta03a"
  | "partial_ta03b"
  | "complete_pending"
  | "published"
  | "auto_zero";

export interface MonitoringAttendance {
  recordId: string;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  permitCount: number;
  totalMeetings: number;
  attendancePercentage: number;
  isEligible: boolean;
}

export interface MonitoringAdvisorRequest {
  /** Canonical status atau "none" untuk yang belum mengajukan. */
  status: string;
  statusLabel: string;
  statusCategory: AdvisorStatusCategory;
  routeType: "normal" | "escalated" | "dept" | null;
  routeLabel: string | null;
  requestType: "ta_01" | "ta_02" | null;
  proposedTitle: string | null;
  targetLecturerId: string | null;
  targetLecturerName: string | null;
  acceptedOverNormal: boolean;
  forwardedToKadepAt: string | null;
  withdrawnAt: string | null;
  lastUpdatedAt: string | null;
}

export interface MonitoringSupervisorRef {
  lecturerId: string | null;
  fullName: string | null;
}

export interface MonitoringScore {
  researchMethodScoreId: string | null;
  thesisId: string | null;
  thesisTitle: string | null;
  /** 4 bucket sesuai layout xlsx (null = belum dinilai). */
  presentasi: number | null;
  proposalKonten: number | null;
  proposalStruktur: number | null;
  kemampuanRespon: number | null;
  /** Total TA-03A (Presentasi + Konten + Respons; max 75). */
  supervisorScore: number | null;
  /** Total TA-03B (Struktur; max 25). */
  lecturerScore: number | null;
  /** TA-03A + TA-03B (max 100). */
  finalScore: number | null;
  isFinalized: boolean;
  finalizedAt: string | null;
  coSignedAt: string | null;
  attendanceAutoZeroedAt: string | null;
  attendanceAutoZeroReason: string | null;
  completeness: ScoreCompleteness;
}

/** Baris mahasiswa eligible SIA. */
export interface MonitoringStudentRow {
  rowNumber: number;
  studentId: string;
  identityNumber: string | null;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  enrollmentYear: number | null;
  studentStatus: string;
  researchMethodCompleted: boolean;
  takingThesisCourse: boolean | null;
  eligibleMetopen: boolean;
  eligibilitySource: "sia" | "devtools" | null;
  eligibilityUpdatedAt: string | null;
  isMatched: true;
  isInImport: boolean;
  attendance: MonitoringAttendance | null;
  advisorRequest: MonitoringAdvisorRequest;
  supervisors: {
    pembimbing1: MonitoringSupervisorRef;
    pembimbing2: MonitoringSupervisorRef;
  };
  score: MonitoringScore;
}

/** Baris unmatched: NIM di import tidak match student DB. */
export interface MonitoringUnmatchedRow {
  rowNumber: number;
  identityNumber: string;
  fullName: string | null;
  isMatched: false;
  isInImport: true;
  attendance: MonitoringAttendance | null;
  advisorRequest: MonitoringAdvisorRequest;
  supervisors: {
    pembimbing1: MonitoringSupervisorRef;
    pembimbing2: MonitoringSupervisorRef;
  };
  score: MonitoringScore;
}

export interface MonitoringAttendanceImport {
  id: string;
  academicYearId: string | null;
  classCode: string | null;
  courseName: string | null;
  semesterLabel: string | null;
  filterLabel: string | null;
  lecturerNames: string[] | null;
  thresholdPercent: number;
  totalRows: number;
  matchedRows: number;
  eligibleRows: number;
  ineligibleRows: number;
  autoZeroedCount: number;
  uploadedAt: string;
}

export interface MonitoringStats {
  totalEligibleSia: number;
  totalInImport: number;
  missingFromImport: number;
  unmatchedInImport: number;
  attendanceEligible: number;
  attendanceIneligible: number;
  advisorByCategory: Record<AdvisorStatusCategory, number>;
  scoreByCompleteness: Record<ScoreCompleteness, number>;
}

export interface MonitoringResponse {
  attendanceImport: MonitoringAttendanceImport | null;
  stats: MonitoringStats;
  students: MonitoringStudentRow[];
  unmatchedRecords: MonitoringUnmatchedRow[];
}
