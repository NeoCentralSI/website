/**
 * Label bahasa Indonesia untuk nilai enum TA. API mengirim nilai enum,
 * frontend memberi label di sini. Isi peta harus sama persis dengan
 * `app/backend/src/constants/thesisLabels.js`.
 */

export type ThesisLifecycleStatus = "proposal" | "research" | "on_leave" | "completed" | "failed";
export type ThesisPhase = "proposal" | "research";
export type ThesisTerminationReason = "supervision_evaluation" | "withdrawn" | "dropped_out" | "other";
/** Tingkat aktivitas TA fase penelitian. Nilai turunan dari tanggal aktivitas terakhir, tidak disimpan. */
export type ThesisActivityLevel = "active" | "slow" | "at_risk";
/** Evaluasi bimbingan yang jatuh tempo. Nilai turunan dari masa bimbingan, tidak disimpan. */
export type EvaluationDue = "six_month" | "extension_follow_up" | "one_year";

/** Masa bimbingan: dihitung dari tanggal mulai, tidak menghitung masa cuti (BSS). */
export interface SupervisionClock {
  startedAt: string | null;
  elapsedDays: number | null;
  elapsedMonths: number | null;
  /** Contoh: "7 bulan 12 hari"; "-" bila tanggal mulai belum diisi. */
  elapsedLabel: string;
  sixMonthAt: string | null;
  oneYearAt: string | null;
  extensionUntil: string | null;
  evaluationDue: EvaluationDue | null;
  /** True selama TA berstatus BSS: masa bimbingan berhenti. */
  isPaused: boolean;
}
/** Status sesi bimbingan (`GuidanceStatus`). */
export type GuidanceSessionStatus =
  | "requested"
  | "accepted"
  | "rescheduled"
  | "rejected"
  | "summary_pending"
  | "summary_rejected"
  | "completed"
  | "cancelled"
  | "deleted";
/** Pihak yang membatalkan sesi (`GuidanceActor`). */
export type GuidanceActor = "student" | "lecturer" | "system";
/** Status milestone (`MilestoneStatus`). */
export type MilestoneStatusValue = "not_started" | "in_progress" | "pending_review" | "revision_needed" | "completed" | "deleted";

export type ThesisBadgeVariant = "default" | "secondary" | "destructive" | "outline" | "warning" | "success" | "info";

export const THESIS_STATUS_LABELS: Record<ThesisLifecycleStatus, string> = {
  proposal: "Proposal",
  research: "Penelitian",
  on_leave: "Berhenti Studi Sementara (BSS)",
  completed: "Selesai",
  failed: "Gagal",
};

export const THESIS_PHASE_LABELS: Record<ThesisPhase, string> = {
  proposal: "Proposal",
  research: "Penelitian",
};

export const THESIS_TERMINATION_REASON_LABELS: Record<ThesisTerminationReason, string> = {
  supervision_evaluation: "Dihentikan melalui evaluasi bimbingan",
  withdrawn: "Mengundurkan diri",
  dropped_out: "Drop out",
  other: "Lainnya",
};

export const THESIS_ACTIVITY_LABELS: Record<ThesisActivityLevel, string> = {
  active: "Lancar",
  slow: "Lambat",
  at_risk: "Berisiko",
};

/** Aturan tiap tingkat aktivitas, ditampilkan sebagai tooltip badge. */
export const THESIS_ACTIVITY_DESCRIPTIONS: Record<ThesisActivityLevel, string> = {
  active: "Ada aktivitas dalam 60 hari terakhir.",
  slow: "Tanpa aktivitas selama 60 sampai 120 hari.",
  at_risk: "Tanpa aktivitas lebih dari 120 hari.",
};

export const EVALUATION_DUE_LABELS: Record<EvaluationDue, string> = {
  six_month: "Evaluasi 6 bulan jatuh tempo",
  extension_follow_up: "Tindak lanjut perpanjangan jatuh tempo",
  one_year: "Evaluasi 1 tahun jatuh tempo",
};

/** Jenis Pengajuan Perubahan Tugas Akhir (`ThesisChangeRequestType`). */
export type ChangeRequestType = "title" | "supervisor" | "both";
export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
/** Posisi pembimbing yang diubah (`ThesisSupervisorPosition`). */
export type SupervisorPosition = "pembimbing_1" | "pembimbing_2";
/** Langkah persetujuan: `ThesisChangeApprovalRole` ditambah langkah akhir Ketua Departemen. */
export type ChangeRequestStepKey = "main_supervisor" | "previous_supervisor" | "new_supervisor" | "kadep";

export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  title: "Judul",
  supervisor: "Pembimbing",
  both: "Judul dan Pembimbing",
};

/** Jenis "Alihkan": pengajuan pembimbing yang dibuat lewat "Alihkan Mahasiswa" (punya `batchId`). */
export const CHANGE_REQUEST_TRANSFER_LABEL = "Alihkan";

/** Jenis yang tampil di tabel Perubahan: Judul / Pembimbing / Judul dan Pembimbing / Alihkan. */
export function getChangeRequestKindLabel(request: { requestType: ChangeRequestType; batchId?: string | null }): string {
  return request.batchId ? CHANGE_REQUEST_TRANSFER_LABEL : getChangeRequestTypeLabel(request.requestType);
}

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export const CHANGE_REQUEST_STATUS_VARIANTS: Record<ChangeRequestStatus, ThesisBadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "outline",
};

/**
 * Status of a row of the change-request tables, which depends on the viewer
 * while the request is open. Tugas Akhir > Perubahan (Ketua Departemen) uses "awaiting_decision";
 * the Perubahan TA rows of Tugas Akhir > Permohonan (a lecturer's own steps) use "awaiting_me".
 */
export type ChangeRequestViewStatus = "awaiting_decision" | "awaiting_me" | "in_progress" | "approved" | "rejected" | "cancelled";

export const CHANGE_REQUEST_VIEW_STATUS_LABELS: Record<ChangeRequestViewStatus, string> = {
  awaiting_decision: "Menunggu Keputusan Anda",
  awaiting_me: "Menunggu Persetujuan Anda",
  in_progress: "Sedang Berjalan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export const CHANGE_REQUEST_VIEW_STATUS_VARIANTS: Record<ChangeRequestViewStatus, ThesisBadgeVariant> = {
  awaiting_decision: "warning",
  awaiting_me: "warning",
  in_progress: "info",
  approved: "success",
  rejected: "destructive",
  cancelled: "outline",
};

export const CHANGE_REQUEST_STEP_LABELS: Record<ChangeRequestStepKey, string> = {
  main_supervisor: "Pembimbing 1",
  previous_supervisor: "Pembimbing Sebelumnya",
  new_supervisor: "Pembimbing Baru",
  kadep: "Ketua Departemen",
};

export const SUPERVISOR_POSITION_LABELS: Record<SupervisorPosition, string> = {
  pembimbing_1: "Pembimbing 1",
  pembimbing_2: "Pembimbing 2",
};

/** Evaluasi Bimbingan (formulir TA-17). */
export type GuidanceEvaluationType = "six_month" | "one_year";
export type GuidanceEvaluationRecommendation = "continue" | "extend_1_month" | "revise_proposal" | "terminate_supervision";
export type GuidanceEvaluationStatus = "pending" | "approved" | "rejected";
export type GuidanceEvaluationObservation = "noGuidance" | "noProgress" | "noResponse" | "noRevision";

export const GUIDANCE_EVALUATION_TYPE_LABELS: Record<GuidanceEvaluationType, string> = {
  six_month: "Evaluasi 6 Bulan",
  one_year: "Evaluasi 1 Tahun",
};

/** Tahap evaluasi (nilai `EvaluationDue`): tindak lanjut adalah bagian dari evaluasi 6 bulan. */
export const GUIDANCE_EVALUATION_STAGE_LABELS: Record<EvaluationDue, string> = {
  six_month: "Evaluasi 6 Bulan",
  extension_follow_up: "Tindak Lanjut Evaluasi 6 Bulan",
  one_year: "Evaluasi 1 Tahun",
};

export const GUIDANCE_EVALUATION_RECOMMENDATION_LABELS: Record<GuidanceEvaluationRecommendation, string> = {
  continue: "Lanjut Bimbingan",
  extend_1_month: "Peringatan dan Perpanjangan 1 Bulan",
  revise_proposal: "Mengulang Proposal",
  terminate_supervision: "Dihentikan",
};

/** Akibat tiap keputusan, ditampilkan di formulir sebelum dikirim. */
export const GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS: Record<GuidanceEvaluationRecommendation, string> = {
  continue: "Langsung tercatat, tanpa keputusan Ketua Departemen.",
  extend_1_month: "Setelah disetujui Ketua Departemen: mahasiswa menerima peringatan akademik dan perpanjangan 1 bulan sejak tanggal keputusan.",
  revise_proposal: "Setelah disetujui Ketua Departemen: status tugas akhir kembali ke Proposal; bimbingan dan milestone terkunci.",
  terminate_supervision: "Setelah disetujui Ketua Departemen: tugas akhir berstatus Gagal, pembimbing dilepas, dan sesi terbuka dibatalkan.",
};

export const GUIDANCE_EVALUATION_STATUS_LABELS: Record<GuidanceEvaluationStatus, string> = {
  pending: "Menunggu Keputusan Ketua Departemen",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const GUIDANCE_EVALUATION_STATUS_VARIANTS: Record<GuidanceEvaluationStatus, ThesisBadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

/** Status of a row of the Ketua Departemen's Evaluasi table ("Tercatat" = Lanjut Bimbingan). */
export type GuidanceEvaluationViewStatus = "awaiting_decision" | "approved" | "rejected" | "recorded";

export const GUIDANCE_EVALUATION_VIEW_STATUS_LABELS: Record<GuidanceEvaluationViewStatus, string> = {
  awaiting_decision: "Menunggu Keputusan Anda",
  approved: "Disetujui",
  rejected: "Ditolak",
  recorded: "Tercatat",
};

export const GUIDANCE_EVALUATION_VIEW_STATUS_VARIANTS: Record<GuidanceEvaluationViewStatus, ThesisBadgeVariant> = {
  awaiting_decision: "warning",
  approved: "success",
  rejected: "destructive",
  recorded: "success",
};

export const GUIDANCE_EVALUATION_OBSERVATION_LABELS: Record<GuidanceEvaluationObservation, string> = {
  noGuidance: "Tidak melakukan bimbingan selama periode evaluasi",
  noProgress: "Tidak menunjukkan kemajuan berarti",
  noResponse: "Tidak merespons komunikasi pembimbing",
  noRevision: "Tidak menyerahkan revisi sesuai arahan",
};

/** Alasan aksi bimbingan/milestone terkunci selama TA mengulang proposal. */
export const REPEAT_PROPOSAL_LOCK_REASON = "Mengulang proposal berdasarkan evaluasi bimbingan.";
/** Fase proposal belum terbuka: sama dengan pesan backend. */
export const PROPOSAL_NOT_ASSIGNED_REASON =
  "Bimbingan dan milestone fase proposal terbuka setelah Ketua Departemen menerbitkan Penetapan Pembimbing.";

/** Pilihan fase di daftar bimbingan dan milestone (10.7): "Semua · Proposal · Penelitian". */
export const THESIS_PHASE_FILTER_LABELS: Record<ThesisPhase, string> = {
  proposal: "Proposal",
  research: "Penelitian",
};

/** Hitungan satu fase dari backend (`phases.proposal` / `phases.research`). */
export interface PhaseActivity {
  guidances: { total: number; completed: number };
  milestones: { total: number; completed: number };
}

/** Fase berjalan, Penetapan Pembimbing, dan hitungan per fase pada detail TA (10.7). */
export interface ThesisPhaseSummary {
  currentPhase?: ThesisPhase;
  supervisorAssignedAt?: string | null;
  proposalPhaseOpen?: boolean;
  phases?: { proposal: PhaseActivity; research: PhaseActivity };
}

/** `rescheduled` adalah data lama yang diperlakukan sama dengan `accepted`. */
export const GUIDANCE_STATUS_LABELS: Record<GuidanceSessionStatus, string> = {
  requested: "Menunggu Persetujuan",
  accepted: "Terjadwal",
  rescheduled: "Terjadwal",
  rejected: "Ditolak",
  summary_pending: "Menunggu Persetujuan Ringkasan",
  summary_rejected: "Ringkasan Perlu Diperbaiki",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  deleted: "Dihapus",
};

export const GUIDANCE_ACTOR_LABELS: Record<GuidanceActor, string> = {
  student: "Mahasiswa",
  lecturer: "Dosen",
  system: "Sistem",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatusValue, string> = {
  not_started: "Belum Dimulai",
  in_progress: "Sedang Dikerjakan",
  pending_review: "Menunggu Review",
  revision_needed: "Perlu Revisi",
  completed: "Selesai",
  deleted: "Dihapus",
};

export const THESIS_STATUS_VARIANTS: Record<ThesisLifecycleStatus, ThesisBadgeVariant> = {
  proposal: "secondary",
  research: "info",
  on_leave: "warning",
  completed: "success",
  failed: "destructive",
};

export const THESIS_PHASE_VARIANTS: Record<ThesisPhase, ThesisBadgeVariant> = {
  proposal: "secondary",
  research: "info",
};

export const THESIS_ACTIVITY_VARIANTS: Record<ThesisActivityLevel, ThesisBadgeVariant> = {
  active: "success",
  slow: "warning",
  at_risk: "destructive",
};

/** Warna tingkat aktivitas untuk grafik (hex). */
export const THESIS_ACTIVITY_CHART_COLORS: Record<ThesisActivityLevel, string> = {
  active: "#22c55e",
  slow: "#f59e0b",
  at_risk: "#ef4444",
};

/** Warna status TA untuk grafik (hex) dan bar/titik (kelas Tailwind), satu peta per enum. */
export const THESIS_STATUS_CHART_COLORS: Record<ThesisLifecycleStatus, string> = {
  proposal: "#64748b",
  research: "#3b82f6",
  on_leave: "#f59e0b",
  completed: "#22c55e",
  failed: "#ef4444",
};

export const THESIS_STATUS_BG_CLASSES: Record<ThesisLifecycleStatus, string> = {
  proposal: "bg-slate-500",
  research: "bg-blue-500",
  on_leave: "bg-amber-500",
  completed: "bg-green-500",
  failed: "bg-red-500 text-white",
};

/** Tingkat aktivitas, dari yang paling baik. */
export const THESIS_ACTIVITY_LEVELS: ThesisActivityLevel[] = ["active", "slow", "at_risk"];

/** Status TA yang masih berjalan (belum selesai atau gagal). */
export const OPEN_THESIS_STATUSES: ThesisLifecycleStatus[] = ["proposal", "research", "on_leave"];

/** Status Pengajuan Pembimbing (`ThesisSupervisorRequestStatus`). */
export type SupervisorRequestStatus =
  | "pending"
  | "under_review"
  | "pending_kadep"
  | "revision_requested"
  | "accepted"
  | "assigned"
  | "rejected_by_lecturer"
  | "rejected_by_kadep"
  | "redirected"
  | "withdrawn"
  | "cancelled"
  | "closed";
export type SupervisorRequestRoute = "direct" | "over_quota" | "department";
/** Beban bimbingan dosen terhadap batas yang berlaku (dihitung, rencana 10.1). */
export type SupervisionLoadLevel = "available" | "near_limit" | "full";
export type ResearchMethodResult = "passed" | "failed";
/** Versi Penetapan Pembimbing per periode: hanya satu yang berlaku. */
export type AssignmentBatchStatus = "current" | "superseded";
/** Keputusan proses kelulusan (naik ke Penelitian). */
export type PromotionDecision = "promote" | "wait_sia" | "wait_thesis_course" | "wait_next_period";
/** Proposal revisi TA yang mengulang proposal. */
export type ProposalRevisionStatus = "submitted" | "revision_requested" | "approved";

export const SUPERVISOR_REQUEST_STATUS_LABELS: Record<SupervisorRequestStatus, string> = {
  pending: "Menunggu Dosen",
  under_review: "Sedang Ditinjau Dosen",
  pending_kadep: "Menunggu Ketua Departemen",
  revision_requested: "Perlu Revisi",
  accepted: "Disetujui, Menunggu Penetapan Pembimbing",
  assigned: "Pembimbing Ditetapkan",
  rejected_by_lecturer: "Ditolak Dosen",
  rejected_by_kadep: "Ditolak Ketua Departemen",
  redirected: "Dialihkan Ketua Departemen, Menunggu Penetapan Pembimbing",
  withdrawn: "Ditarik",
  cancelled: "Dibatalkan",
  closed: "Ditutup",
};

/**
 * The short status of a Pengajuan Pembimbing in a table cell, so the badge stays
 * on one line inside its column; the full label is its tooltip.
 */
export const SUPERVISOR_REQUEST_STATUS_SHORT_LABELS: Record<SupervisorRequestStatus, string> = {
  pending: "Menunggu Dosen",
  under_review: "Sedang Ditinjau",
  pending_kadep: "Menunggu Kadep",
  revision_requested: "Perlu Revisi",
  accepted: "Diterima",
  assigned: "Ditetapkan",
  rejected_by_lecturer: "Ditolak Dosen",
  rejected_by_kadep: "Ditolak Kadep",
  redirected: "Dialihkan",
  withdrawn: "Ditarik",
  cancelled: "Dibatalkan",
  closed: "Ditutup",
};

/** The two kinds of rows of Tugas Akhir > Permohonan. */
export type LecturerInboxKind = "supervisor_request" | "change_request" | "supervisor2_request";

/**
 * The Jenis of a Permohonan row, one badge: the supervisor request, or the kind of
 * change ("Alihkan" is a supervisor change). Also the values of the Jenis filter.
 */
export type LecturerInboxJenis = "supervisor_request" | "change_title" | "change_supervisor" | "change_both" | "supervisor2";

/** "Pembimbing 2", the proposal-phase Pembimbing 2 requests, in the same table. */
export const LECTURER_INBOX_JENIS_LABELS: Record<LecturerInboxJenis, string> = {
  supervisor_request: "Pengajuan Pembimbing",
  change_title: "Perubahan Judul",
  change_supervisor: "Perubahan Pembimbing",
  change_both: "Perubahan Judul & Pembimbing",
  supervisor2: "Pembimbing 2",
};

export function lecturerInboxJenisOf(row: { kind: LecturerInboxKind; changeRequest?: { requestType: ChangeRequestType } }): LecturerInboxJenis {
  if (row.kind === "supervisor2_request") return "supervisor2";
  if (row.kind === "supervisor_request" || !row.changeRequest) return "supervisor_request";
  return `change_${row.changeRequest.requestType}` as LecturerInboxJenis;
}

export const SUPERVISOR_REQUEST_ROUTE_LABELS: Record<SupervisorRequestRoute, string> = {
  direct: "Pilih Dosen Sendiri",
  over_quota: "Pengajuan di Atas Kuota",
  department: "Ditetapkan Departemen",
};

export const SUPERVISION_LOAD_LEVEL_LABELS: Record<SupervisionLoadLevel, string> = {
  available: "Tersedia",
  near_limit: "Mendekati Batas",
  full: "Penuh",
};

export const RESEARCH_METHOD_RESULT_LABELS: Record<ResearchMethodResult, string> = {
  passed: "Lulus",
  failed: "Tidak Lulus",
};

export const ASSIGNMENT_BATCH_STATUS_LABELS: Record<AssignmentBatchStatus, string> = {
  current: "Berlaku",
  superseded: "Digantikan",
};

export const PROMOTION_DECISION_LABELS: Record<PromotionDecision, string> = {
  promote: "Siap Naik",
  wait_sia: "Menunggu Data SIA",
  wait_thesis_course: "Menunggu KRS Tugas Akhir",
  wait_next_period: "Menunggu Periode Berikutnya",
};

export const PROPOSAL_REVISION_STATUS_LABELS: Record<ProposalRevisionStatus, string> = {
  submitted: "Menunggu Tinjauan Pembimbing 1",
  revision_requested: "Perlu Revisi",
  approved: "Disetujui",
};

export const PROPOSAL_REVISION_STATUS_VARIANTS: Record<ProposalRevisionStatus, ThesisBadgeVariant> = {
  submitted: "warning",
  revision_requested: "destructive",
  approved: "success",
};

export const PROMOTION_DECISION_VARIANTS: Record<PromotionDecision, ThesisBadgeVariant> = {
  promote: "success",
  wait_sia: "warning",
  wait_thesis_course: "outline",
  wait_next_period: "outline",
};

export const SUPERVISOR_REQUEST_STATUS_VARIANTS: Record<SupervisorRequestStatus, ThesisBadgeVariant> = {
  pending: "warning",
  under_review: "info",
  pending_kadep: "warning",
  revision_requested: "warning",
  accepted: "info",
  assigned: "success",
  rejected_by_lecturer: "destructive",
  rejected_by_kadep: "destructive",
  redirected: "info",
  withdrawn: "outline",
  cancelled: "outline",
  closed: "outline",
};

export const SUPERVISION_LOAD_LEVEL_VARIANTS: Record<SupervisionLoadLevel, ThesisBadgeVariant> = {
  available: "success",
  near_limit: "warning",
  full: "destructive",
};

export const RESEARCH_METHOD_RESULT_VARIANTS: Record<ResearchMethodResult, ThesisBadgeVariant> = {
  passed: "success",
  failed: "destructive",
};

export const ASSIGNMENT_BATCH_STATUS_VARIANTS: Record<AssignmentBatchStatus, ThesisBadgeVariant> = {
  current: "success",
  superseded: "outline",
};

function labelOf<K extends string>(labels: Record<K, string>) {
  return (value: string | null | undefined): string =>
    value ? (labels[value as K] ?? String(value)) : "-";
}

export const getThesisStatusLabel = labelOf(THESIS_STATUS_LABELS);
export const getThesisPhaseLabel = labelOf(THESIS_PHASE_LABELS);
export const getThesisTerminationReasonLabel = labelOf(THESIS_TERMINATION_REASON_LABELS);
export const getThesisActivityLabel = labelOf(THESIS_ACTIVITY_LABELS);
export const getEvaluationDueLabel = labelOf(EVALUATION_DUE_LABELS);
export const getGuidanceStatusLabel = labelOf(GUIDANCE_STATUS_LABELS);
export const getGuidanceActorLabel = labelOf(GUIDANCE_ACTOR_LABELS);
export const getMilestoneStatusLabel = labelOf(MILESTONE_STATUS_LABELS);
export const getChangeRequestTypeLabel = labelOf(CHANGE_REQUEST_TYPE_LABELS);
export const getChangeRequestStatusLabel = labelOf(CHANGE_REQUEST_STATUS_LABELS);
export const getChangeRequestStepLabel = labelOf(CHANGE_REQUEST_STEP_LABELS);
export const getChangeRequestViewStatusLabel = labelOf(CHANGE_REQUEST_VIEW_STATUS_LABELS);
export const getGuidanceEvaluationViewStatusLabel = labelOf(GUIDANCE_EVALUATION_VIEW_STATUS_LABELS);
export const getSupervisorRequestStatusShortLabel = labelOf(SUPERVISOR_REQUEST_STATUS_SHORT_LABELS);
export const getSupervisorPositionLabel = labelOf(SUPERVISOR_POSITION_LABELS);
export const getGuidanceEvaluationTypeLabel = labelOf(GUIDANCE_EVALUATION_TYPE_LABELS);
export const getGuidanceEvaluationStageLabel = labelOf(GUIDANCE_EVALUATION_STAGE_LABELS);
export const getGuidanceEvaluationRecommendationLabel = labelOf(GUIDANCE_EVALUATION_RECOMMENDATION_LABELS);
export const getGuidanceEvaluationStatusLabel = labelOf(GUIDANCE_EVALUATION_STATUS_LABELS);

export const getSupervisorRequestStatusLabel = labelOf(SUPERVISOR_REQUEST_STATUS_LABELS);
export const getSupervisorRequestRouteLabel = labelOf(SUPERVISOR_REQUEST_ROUTE_LABELS);
export const getSupervisionLoadLevelLabel = labelOf(SUPERVISION_LOAD_LEVEL_LABELS);
export const getResearchMethodResultLabel = labelOf(RESEARCH_METHOD_RESULT_LABELS);
export const getAssignmentBatchStatusLabel = labelOf(ASSIGNMENT_BATCH_STATUS_LABELS);
export const getPromotionDecisionLabel = labelOf(PROMOTION_DECISION_LABELS);

export function getPromotionDecisionVariant(value: string | null | undefined): ThesisBadgeVariant {
  return PROMOTION_DECISION_VARIANTS[value as PromotionDecision] ?? "outline";
}

export const getProposalRevisionStatusLabel = labelOf(PROPOSAL_REVISION_STATUS_LABELS);

export function getProposalRevisionStatusVariant(value: string | null | undefined): ThesisBadgeVariant {
  return PROPOSAL_REVISION_STATUS_VARIANTS[value as ProposalRevisionStatus] ?? "outline";
}

export function getSupervisorRequestStatusVariant(value: string | null | undefined): ThesisBadgeVariant {
  return SUPERVISOR_REQUEST_STATUS_VARIANTS[value as SupervisorRequestStatus] ?? "outline";
}

export function getSupervisionLoadLevelVariant(value: string | null | undefined): ThesisBadgeVariant {
  return SUPERVISION_LOAD_LEVEL_VARIANTS[value as SupervisionLoadLevel] ?? "outline";
}

export function getAssignmentBatchStatusVariant(value: string | null | undefined): ThesisBadgeVariant {
  return ASSIGNMENT_BATCH_STATUS_VARIANTS[value as AssignmentBatchStatus] ?? "outline";
}

export function getResearchMethodResultVariant(value: string | null | undefined): ThesisBadgeVariant {
  return RESEARCH_METHOD_RESULT_VARIANTS[value as ResearchMethodResult] ?? "outline";
}

export function getThesisStatusVariant(value: string | null | undefined): ThesisBadgeVariant {
  return THESIS_STATUS_VARIANTS[value as ThesisLifecycleStatus] ?? "outline";
}

export function getThesisPhaseVariant(value: string | null | undefined): ThesisBadgeVariant {
  return THESIS_PHASE_VARIANTS[value as ThesisPhase] ?? "outline";
}

export function getThesisActivityVariant(value: string | null | undefined): ThesisBadgeVariant {
  return THESIS_ACTIVITY_VARIANTS[value as ThesisActivityLevel] ?? "outline";
}

/**
 * Status transitions, mirrored from `backend/src/services/thesisLifecycle.service.js`.
 * `on_leave` may only return to `statusBeforeLeave` (or become `failed`).
 */
export const THESIS_STATUS_TRANSITIONS: Record<ThesisLifecycleStatus, ThesisLifecycleStatus[]> = {
  proposal: ["research", "on_leave", "failed"],
  research: ["on_leave", "completed", "failed"],
  on_leave: ["proposal", "research", "failed"],
  completed: [],
  failed: [],
};

/** Statuses a new thesis may start with in the data master. */
export const CREATABLE_THESIS_STATUSES: ThesisLifecycleStatus[] = ["proposal", "research", "completed", "failed"];

/** Options for the status field: the current status plus the allowed transitions. */
export function getAllowedThesisStatusOptions(
  current: ThesisLifecycleStatus | null | undefined,
  statusBeforeLeave?: ThesisLifecycleStatus | null,
): { value: ThesisLifecycleStatus; label: string }[] {
  let values: ThesisLifecycleStatus[];
  if (!current) {
    values = CREATABLE_THESIS_STATUSES;
  } else if (current === "on_leave") {
    values = ["on_leave", statusBeforeLeave ?? "research", "failed"];
  } else {
    values = [current, ...THESIS_STATUS_TRANSITIONS[current]];
  }
  return values.map((value) => ({ value, label: THESIS_STATUS_LABELS[value] }));
}

/** Opsi alasan penghentian (status `failed`). */
export function getTerminationReasonOptions(): { value: ThesisTerminationReason; label: string }[] {
  return (Object.keys(THESIS_TERMINATION_REASON_LABELS) as ThesisTerminationReason[]).map((value) => ({
    value,
    label: THESIS_TERMINATION_REASON_LABELS[value],
  }));
}

/** Opsi dropdown status TA (urutan siklus hidup). */
export function getThesisStatusOptions(): { value: ThesisLifecycleStatus; label: string }[] {
  return (Object.keys(THESIS_STATUS_LABELS) as ThesisLifecycleStatus[]).map((value) => ({
    value,
    label: THESIS_STATUS_LABELS[value],
  }));
}

/** Opsi filter tingkat aktivitas. */
export function getThesisActivityOptions(): { value: ThesisActivityLevel; label: string }[] {
  return THESIS_ACTIVITY_LEVELS.map((value) => ({ value, label: THESIS_ACTIVITY_LABELS[value] }));
}

/**
 * Alasan aksi bimbingan dinonaktifkan: aksi tulis bimbingan dan milestone untuk TA
 * berstatus `research`, atau `proposal` setelah Penetapan Pembimbing. Mengembalikan null
 * bila aksi boleh dilakukan.
 */
export function getGuidanceActionBlockReason(
  status: string | null | undefined,
  owner: "Anda" | "mahasiswa" = "Anda",
  options: { repeatingProposal?: boolean | null; proposalPhaseOpen?: boolean | null } = {},
): string | null {
  if (status === "research") return null;
  // TA yang dikembalikan ke proposal oleh evaluasi bimbingan menyebut alasannya.
  if (status === "proposal" && options.repeatingProposal) {
    return `${REPEAT_PROPOSAL_LOCK_REASON} Bimbingan dan milestone terkunci sampai Pembimbing 1 menyetujui proposal revisi (Tugas Akhir > Proposal).`;
  }
  // Fase proposal terbuka setelah Penetapan Pembimbing.
  if (status === "proposal") return options.proposalPhaseOpen ? null : PROPOSAL_NOT_ASSIGNED_REASON;
  if (!status) return owner === "Anda" ? "Anda belum memiliki tugas akhir yang aktif." : "Mahasiswa belum memiliki tugas akhir yang aktif.";
  return `Aksi ini hanya tersedia untuk tugas akhir berstatus "${THESIS_STATUS_LABELS.research}". Status tugas akhir ${owner} saat ini: "${getThesisStatusLabel(status)}".`;
}
