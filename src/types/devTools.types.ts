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
