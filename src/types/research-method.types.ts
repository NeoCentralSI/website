import type { PromotionDecision, ResearchMethodResult, SupervisorRequestRoute, SupervisorRequestStatus, ThesisLifecycleStatus } from '@/lib/thesisLabels';
import type { AcademicYearRef } from '@/types/thesis-proposal.types';

export type AssessorParty = 'supervisor' | 'coordinator';

export interface AttendanceTotals {
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  eligibleRows: number;
  ineligibleRows: number;
  autoZeroedCount?: number;
  skippedFinalizedCount?: number;
  willAutoZeroCount?: number;
  willSkipFinalizedCount?: number;
}

export interface AttendanceRow {
  id?: string;
  identityNumber: string;
  studentName: string | null;
  matched?: boolean;
  presentCount?: number;
  totalMeetings?: number;
  attendancePercentage: number;
  isEligible?: boolean;
  thesisTitle?: string | null;
}

export interface AttendanceImport {
  id: string;
  academicYear: AcademicYearRef | null;
  classCode: string | null;
  courseName: string | null;
  semesterLabel: string | null;
  lecturerNames: string[];
  sourceFiles: { index: number; originalName: string; classCode: string | null; rowCount: number; fileSize: number | null; url: string }[];
  thresholdPercent: number;
  totals: AttendanceTotals;
  uploadedAt: string;
  uploadedBy: { id: string; fullName: string | null } | null;
  records?: AttendanceRow[];
}

export interface AttendanceOverview {
  academicYear: AcademicYearRef;
  thresholdPercent: number;
  current: AttendanceImport | null;
  history: AttendanceImport[];
}

export interface AttendancePreview {
  academicYear: AcademicYearRef;
  metadata: { classCode: string | null; courseName: string | null; semesterLabel: string | null };
  sourceFiles: { originalName: string; classCode: string | null; rowCount: number }[];
  thresholdPercent: number;
  totals: AttendanceTotals;
  willAutoZero: AttendanceRow[];
  willSkipFinalized: AttendanceRow[];
  unmatchedRows: AttendanceRow[];
}

export interface AttendanceUploadResult {
  import: AttendanceImport;
  autoZeroed: { thesisId: string; thesisTitle: string | null; identityNumber: string; attendancePercentage: number }[];
  reopenedCount: number;
  unmatchedRows: AttendanceRow[];
}

export interface AssessmentRubric {
  id: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export interface AssessmentCriterion {
  id: string;
  name: string;
  maxScore: number;
  cpmk: { id: string; code: string; description: string };
  rubrics: AssessmentRubric[];
}

export interface AssessmentForm {
  party: AssessorParty;
  academicYear: AcademicYearRef;
  weight: number;
  minimumScore: number;
  criteria: AssessmentCriterion[];
}

export interface ScoreDetail {
  assessmentCriteriaId: string;
  assessmentRubricId: string | null;
  score: number;
}

export interface AssessmentView {
  id: string | null;
  academicYear?: AcademicYearRef;
  minimumScore?: number;
  thesis: {
    id: string;
    title: string | null;
    status: ThesisLifecycleStatus;
    supervisorAssignedAt: string | null;
    supervisors: { lecturerId: string; fullName: string | null; role: string | null }[];
  };
  student: { id: string; fullName: string | null; identityNumber: string | null };
  proposal: { fileName: string | null; url: string | null; submittedAt: string | null } | null;
  supervisorScore?: number | null;
  supervisorScoredAt?: string | null;
  supervisorName?: string | null;
  supervisorDetails?: ScoreDetail[];
  coordinatorScore?: number | null;
  coordinatorScoredAt?: string | null;
  coordinatorName?: string | null;
  coordinatorDetails?: ScoreDetail[];
  finalScore?: number | null;
  isFinalized?: boolean;
  finalizedAt?: string | null;
  result?: ResearchMethodResult | null;
  attendance?: { attendancePercentage: number; isEligible: boolean; presentCount: number; totalMeetings: number } | null;
  attendanceAutoZeroed?: boolean;
  canScore?: boolean;
  scoreBlockReason?: string | null;
}

export interface AssessmentQueue {
  academicYear: AcademicYearRef & { isOperational: boolean };
  minimumScore: number;
  rows: AssessmentView[];
}

export interface ScoreInput {
  criteriaId: string;
  rubricId?: string | null;
  score: number;
}


export interface PromotionRow {
  thesisId: string;
  title: string | null;
  student: { id: string; fullName: string | null; identityNumber: string | null };
  finalScore: number | null;
  passedIn: string | null;
  assignedIn: string | null;
  decision: PromotionDecision;
  reason: string;
  error?: string;
}

export interface PromotionPreview {
  academicYear: AcademicYearRef | null;
  rows: PromotionRow[];
}

export interface PromotionRunResult {
  academicYear: AcademicYearRef | null;
  promoted: PromotionRow[];
  deferred: PromotionRow[];
  failed: PromotionRow[];
}

export interface MonitoringRow {
  studentId: string;
  fullName: string | null;
  identityNumber: string | null;
  thesis: {
    id: string;
    title: string | null;
    status: ThesisLifecycleStatus;
    supervisorAssignedAt: string | null;
    supervisors: { fullName: string | null; role: string | null }[];
    proposalGuidances: number;
  } | null;
  request: { status: SupervisorRequestStatus; route: SupervisorRequestRoute } | null;
  attendance: { attendancePercentage: number; isEligible: boolean } | null;
  assessment: {
    id: string;
    finalProposalAt: string | null;
    supervisorScore: number | null;
    coordinatorScore: number | null;
    finalScore: number | null;
    isFinalized: boolean;
    result: ResearchMethodResult | null;
    attendanceAutoZeroed: boolean;
  } | null;
}

export interface ClassMonitoring {
  academicYear: AcademicYearRef;
  minimumScore: number;
  summary: { total: number; withSupervisor: number; assigned: number; finalProposal: number; finalized: number; passed: number; failed: number; promoted: number };
  rows: MonitoringRow[];
}
