import type { ResearchMethodResult, SupervisorRequestRoute, SupervisorRequestStatus, ThesisLifecycleStatus } from '@/lib/thesisLabels';
import type { AcademicYearRef } from '@/types/thesis-proposal.types';

export type AssessorParty = 'supervisor' | 'coordinator';

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

/** A criterion of the score form with the assessor's own score (draft or sent), or null. */
export interface ScoreFormCriterion extends AssessmentCriterion {
  score: number | null;
}

/** The other party's sent score, shown read-only as a reference. */
export interface OtherPartyScore {
  party: AssessorParty;
  submitted: boolean;
  total: number | null;
  weight: number;
  name: string | null;
  submittedAt: string | null;
  criteria: { id: string; name: string; cpmkCode: string; maxScore: number; score: number | null }[];
}

export type OwnScoreStatus = 'empty' | 'draft' | 'submitted';

/** The score form of one assessor for one attempt: own draft or sent score, and the other party's. */
export interface AssessmentScoreForm {
  party: AssessorParty;
  academicYear: AcademicYearRef;
  weight: number;
  minimumScore: number;
  criteria: ScoreFormCriterion[];
  assessment: AssessmentView;
  own: { status: OwnScoreStatus; total: number | null; submittedAt: string | null; name: string | null };
  other: OtherPartyScore;
  canEdit: boolean;
  blockReason: string | null;
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
  canScore?: boolean;
  scoreBlockReason?: string | null;
  /** The viewer's party has a saved draft (never shown to the other party). */
  ownDraftSaved?: boolean;
}

export interface AssessmentQueue {
  academicYear: AcademicYearRef & { isOperational: boolean };
  minimumScore: number;
  rows: AssessmentView[];
}

export interface ScoreInput {
  criteriaId: string;
  score: number;
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
  assessment: {
    id: string;
    finalProposalAt: string | null;
    supervisorScore: number | null;
    coordinatorScore: number | null;
    finalScore: number | null;
    isFinalized: boolean;
    result: ResearchMethodResult | null;
    supervisorName: string | null;
    coordinatorName: string | null;
  } | null;
}

export interface ClassMonitoring {
  academicYear: AcademicYearRef;
  minimumScore: number;
  /** Funnel: Peserta, Punya Pembimbing, Ditetapkan, Proposal Final, Dinilai, Mulai Penelitian; donut: passed, failed, not yet final. */
  summary: { total: number; withSupervisor: number; assigned: number; finalProposal: number; finalized: number; passed: number; failed: number; notFinalized: number };
  rows: MonitoringRow[];
}
