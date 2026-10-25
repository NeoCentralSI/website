/**
 * DEV TOOLS TYPES
 * ⚠️ DELETE THIS FILE when dev tools are no longer needed.
 */

export type StudentStatus = 'active' | 'dropout' | 'bss' | 'lulus' | 'mengundurkan_diri';

/** SIA flags of one semester (plan 10.6); the student list shows the running semester. */
export interface DevToolsPeriodFlags {
  academicYearId: string | null;
  eligibleResearchMethod: boolean | null;
  eligibilitySource: 'sia' | 'devtools' | null;
  eligibilityCapturedAt: string | null;
  takingThesisCourse: boolean | null;
  thesisCourseSource: 'sia' | 'devtools' | null;
  thesisCourseCapturedAt: string | null;
}

/** One semester row of the Proposal tab (every period, flags may be empty). */
export interface DevToolsSemesterFlags extends DevToolsPeriodFlags {
  academicYearLabel: string;
  isActive: boolean;
}

/** Pengajuan Pembimbing in the Proposal tab: the sending time drives the 72-hour rule. */
export interface DevToolsSupervisorRequest {
  id: string;
  status: string;
  route: string;
  createdAt: string;
  withdrawAvailableAt: string;
  proposedTitle: string | null;
  academicYearLabel: string | null;
  student: { fullName: string | null; nim: string | null };
  lecturerName: string | null;
}

export interface DevToolsSupervisorRequestList {
  data: DevToolsSupervisorRequest[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface SetPeriodFlagsDto {
  academicYearId?: string;
  eligibleResearchMethod?: boolean | null;
  takingThesisCourse?: boolean | null;
}

export interface DevToolsStudent {
  id: string;
  fullName: string;
  identityNumber: string;
  email: string | null;
  isVerified: boolean;
  status: StudentStatus;
  enrollmentYear: number | null;
  sksCompleted: number;
  mandatoryCoursesCompleted: boolean;
  mkwuCompleted: boolean;
  internshipCompleted: boolean;
  kknCompleted: boolean;
  currentSemester: number | null;
  periodFlags: DevToolsPeriodFlags;
  latestThesis: {
    id: string;
    status: string;
    title: string | null;
  } | null;
}

export interface DevToolsStudentDetail extends DevToolsStudent {
  roles: { name: string; status: string }[];
  thesis: {
    id: string;
    status: string;
    title: string | null;
    createdAt: string;
  }[];
}

export interface UpdateStudentDto {
  sksCompleted?: number;
  mandatoryCoursesCompleted?: boolean;
  mkwuCompleted?: boolean;
  internshipCompleted?: boolean;
  kknCompleted?: boolean;
  currentSemester?: number;
  enrollmentYear?: number;
  status?: StudentStatus;
}

export interface UpdateUserDto {
  fullName?: string;
  isVerified?: boolean;
}

export interface ThesisRecord {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  academicYearId?: string | null;
  academicYearLabel?: string | null;
  supervisors: {
    role: { name: string };
    lecturer: { user: { fullName: string } };
  }[];
}

export interface DevToolsAcademicYear {
  id: string;
  year: string | number;
  semester: string;
  isActive: boolean;
  label: string;
}

export interface CreateUserDto {
  fullName: string;
  identityNumber: string;
  email?: string;
  password: string;
  identityType: 'NIM' | 'NIP' | 'OTHER';
  roles?: string[];
}

export interface DevToolsUserListItem {
  id: string;
  fullName: string;
  identityNumber: string;
  identityType: string;
  email: string | null;
  isVerified: boolean;
  roles: { name: string; status: string }[];
}

export interface RoleOption {
  id: string;
  name: string;
}

export interface DevToolsGuidance {
  id: string;
  status: string;
  phase: string;
  requestedDate: string;
  approvedDate: string | null;
  summarySubmittedAt: string | null;
  completedAt: string | null;
  thesisId: string | null;
  thesisTitle: string | null;
  studentName: string | null;
  studentNim: string | null;
  supervisorName: string | null;
}

export interface DevToolsGuidanceList {
  data: DevToolsGuidance[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

/** Editable session dates (ISO). `null` clears a nullable column. */
export interface UpdateGuidanceScheduleDto {
  requestedDate?: string;
  approvedDate?: string | null;
  summarySubmittedAt?: string | null;
  completedAt?: string | null;
}

// --- Seminar Hasil, Sidang TA, Yudisium ---

export type DevToolsEventKind = 'seminar' | 'defence';
export type DevToolsEventTarget =
  | 'registered'
  | 'verified'
  | 'examiner_assigned'
  | 'scheduled'
  | 'passed'
  | 'passed_with_revision'
  | 'failed';
export type DevToolsEventMode = 'change' | 'create' | 'delete' | 'approve-revisions';

export interface DevToolsEventCard {
  id: string;
  status: string;
  displayStatus: string;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  examiners: { id: string; name: string; order: number; availabilityStatus: string; score: number | null; submitted: boolean }[];
  finalScore: number | null;
  supervisorScore?: number | null;
  supervisorSubmitted?: boolean;
  grade?: string | null;
  resultFinalizedAt: string | null;
  revision: { total: number; approved: number; finalizedAt: string | null };
  officialDocuments: number;
}

export interface DevToolsFinalStages {
  student: { id: string; fullName: string; nim: string; sksCompleted: number; researchMethodCompleted: boolean };
  thesis: { id: string; title: string | null; status: string } | null;
  seminar: DevToolsEventCard | null;
  defence: DevToolsEventCard | null;
  history: { seminar: number; defence: number };
  guards: { seminar: string | null; defence: string | null };
}

/** What an action will do, shown before it is confirmed. */
export interface DevToolsEffects {
  prerequisites: string[];
  effects: string[];
}

export interface DevToolsScheduleDto {
  preset?: 'now' | 'past' | 'tomorrow';
  date?: string;
  startTime?: string;
  endTime?: string;
}

export type DevToolsPeriodStatus = 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';

export interface DevToolsYudisiumPeriod {
  id: string;
  name: string;
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  eventDate: string | null;
  exitSurveyOpenDate: string | null;
  exitSurveyCloseDate: string | null;
  appointedAt: string | null;
  decreeUploadedAt: string | null;
  hasExitSurvey: boolean;
  participantCount: number;
  requirementCount: number;
  status: DevToolsPeriodStatus;
}

export type DevToolsPeriodDatesDto = Partial<
  Record<'registrationOpenDate' | 'registrationCloseDate' | 'eventDate' | 'exitSurveyOpenDate' | 'exitSurveyCloseDate', string | null>
> & { preset?: 'open' | 'close' | 'event' };

export type DevToolsParticipantStatus = 'registered' | 'eligible' | 'appointed' | 'rejected' | 'finalized';

export interface DevToolsYudisiumParticipant {
  id: string;
  period: DevToolsYudisiumPeriod;
  status: DevToolsParticipantStatus;
  registeredAt: string | null;
  exitSurveySubmittedAt: string | null;
  exitSurveyAnswers: number;
  requirementVerifiedAt: string | null;
  cplValidatedAt: string | null;
  requirements: { itemId: string; name: string; status: 'submitted' | 'approved' | 'declined' | null; verifiedAt: string | null }[];
}

export interface DevToolsCplRow {
  cplId: string;
  code: string;
  description: string;
  minimalScore: number;
  score: number | null;
  oldScore: number | null;
  status: 'calculated' | 'validated' | 'finalized' | null;
  passed: boolean;
  hasRecommendation: boolean;
  hasSettlement: boolean;
  validatedAt: string | null;
}

export interface DevToolsStudentYudisium {
  student: { id: string; fullName: string; nim: string; sksCompleted: number };
  thesis: { id: string; title: string | null; status: string } | null;
  academic: { defencePassed: boolean; sksMet: boolean; coursesMet: boolean };
  participants: DevToolsYudisiumParticipant[];
  cpl: DevToolsCplRow[];
}
