import type {
  ChangeRequestStatus,
  ChangeRequestStepKey,
  ChangeRequestType,
  SupervisorPosition,
  ThesisLifecycleStatus,
} from '@/lib/thesisLabels';

export interface ChangeRequestPerson {
  id: string;
  name: string | null;
  identityNumber: string | null;
}

/** One step of the approval chain; the last one is always the Ketua Departemen. */
export interface ChangeRequestStep {
  key: ChangeRequestStepKey;
  lecturer: ChangeRequestPerson | null;
  status: 'pending' | 'approved' | 'rejected';
  /** The request was closed while this step was still open. */
  skipped: boolean;
  notes: string | null;
  decidedAt: string | null;
}

/** Active supervisions of the new supervisor against the quota. Being full does not block. */
export interface SupervisorLoad {
  activeCount: number;
  quotaMax: number;
  isFull: boolean;
}

export interface ThesisChangeRequest {
  id: string;
  thesisId: string | null;
  batchId: string | null;
  requestType: ChangeRequestType;
  status: ChangeRequestStatus;
  reason: string;
  student: ChangeRequestPerson | null;
  thesisTitle: string | null;
  title: { previous: string | null; next: string | null; newTopic: { id: string; name: string } | null } | null;
  supervisor: {
    position: SupervisorPosition;
    /** Null = the position was empty (a supervisor is added). */
    replaced: ChangeRequestPerson | null;
    next: ChangeRequestPerson | null;
  } | null;
  requestedBy: ChangeRequestPerson | null;
  requestedByStudent: boolean;
  steps: ChangeRequestStep[];
  /** Step that is waiting now; null when the request is closed. */
  currentStep: ChangeRequestStepKey | null;
  decision: { by: ChangeRequestPerson | null; notes: string | null; at: string } | null;
  appliedAt: string | null;
  createdAt: string;
  /** Only sent to the new supervisor and the Ketua Departemen. */
  newSupervisorLoad?: SupervisorLoad | null;
  viewer: { canDecideAsLecturer: boolean; canCancel: boolean };
}

/** What a thesis page shows about change requests. */
export interface ThesisChangeContext {
  thesis: {
    id: string;
    title: string | null;
    status: ThesisLifecycleStatus;
    topic: { id: string; name: string } | null;
    supervisors: { lecturerId: string; name: string | null; position: SupervisorPosition | null }[];
  } | null;
  viewerRole: 'student' | SupervisorPosition | null;
  canSubmit: boolean;
  /** Why "Ajukan Perubahan" is disabled; null when it is available. */
  blockReason: string | null;
  openRequest: ThesisChangeRequest | null;
  history: ThesisChangeRequest[];
}

export interface SupervisorOption {
  id: string;
  name: string;
  identityNumber: string | null;
  positions: SupervisorPosition[];
}

export interface SubmitChangeRequestDto {
  thesisId?: string;
  requestType: ChangeRequestType;
  reason: string;
  newTitle?: string;
  newTopicId?: string | null;
  supervisorRole?: SupervisorPosition;
  newSupervisorId?: string;
}

export interface SubmitTransferDto {
  thesisIds: string[];
  newSupervisorId: string;
  reason: string;
}

export interface ChangeDecisionDto {
  approve: boolean;
  notes?: string | null;
}

export interface LecturerChangeRequests {
  awaitingMe: ThesisChangeRequest[];
  inProgress: ThesisChangeRequest[];
  history: ThesisChangeRequest[];
}

/** Lanjutan Paket E4: filters of Tugas Akhir > Perubahan, filtered and paged on the server. */
export type ChangeRequestScope = 'awaitingMe' | 'inProgress' | 'history';

export interface ChangeRequestInbox {
  data: ThesisChangeRequest[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  /** Open requests per filter, for the filter labels. */
  counts: { awaitingMe: number; inProgress: number };
}

export interface DepartmentChangeRequests {
  data: ThesisChangeRequest[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface BatchDecisionResult {
  batchId: string;
  decided: number;
  failed: number;
  results: { requestId: string; student: string | null; success: boolean; message: string | null }[];
}
