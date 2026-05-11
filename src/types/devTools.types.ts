/**
 * DEV TOOLS TYPES
 * ⚠️ DELETE THIS FILE when dev tools are no longer needed.
 */

export type StudentStatus = 'active' | 'dropout' | 'bss' | 'lulus' | 'mengundurkan_diri';

export interface DevToolsMetopenEligibility {
  eligibleMetopen: boolean | null;
  hasExternalStatus: boolean;
  source: 'sia' | 'devtools' | null;
  updatedAt: string | null;
  readOnly: boolean;
  canAccess: boolean;
  canSubmit: boolean;
  thesisId: string | null;
  thesisTitle: string | null;
  thesisStatus: string | null;
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
  metopenEligibility: DevToolsMetopenEligibility;
  latestThesis: {
    id: string;
    status: string;
    title: string | null;
    proposalStatus: string | null;
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
  supervisors: {
    role: { name: string };
    lecturer: { user: { fullName: string } };
  }[];
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
