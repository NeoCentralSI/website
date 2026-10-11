/**
 * Label bahasa Indonesia untuk nilai enum TA (§2.2b Paket A). API mengirim nilai enum,
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
/** Status sesi bimbingan (`GuidanceStatus`, K19). */
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
/** Status milestone (`MilestoneStatus`, K20). */
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
  research: "Tugas Akhir",
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

/** Jenis Pengajuan Perubahan Tugas Akhir (`ThesisChangeRequestType`, K10). */
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

/** `rescheduled` adalah data lama yang diperlakukan sama dengan `accepted` (K19). */
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
export const getSupervisorPositionLabel = labelOf(SUPERVISOR_POSITION_LABELS);

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
 * K15 transitions, mirrored from `backend/src/services/thesisLifecycle.service.js`.
 * `on_leave` may only return to `statusBeforeLeave` (or become `failed`).
 */
export const THESIS_STATUS_TRANSITIONS: Record<ThesisLifecycleStatus, ThesisLifecycleStatus[]> = {
  proposal: ["research", "on_leave", "failed"],
  research: ["on_leave", "completed", "failed"],
  on_leave: ["proposal", "research", "failed"],
  completed: [],
  failed: [],
};

/** Statuses a new thesis may start with in the data master (K21). */
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
 * Alasan aksi bimbingan dinonaktifkan (K14): aksi tulis bimbingan dan milestone hanya untuk
 * TA berstatus `research`. Mengembalikan null bila aksi boleh dilakukan.
 */
export function getGuidanceActionBlockReason(
  status: string | null | undefined,
  owner: "Anda" | "mahasiswa" = "Anda",
): string | null {
  if (status === "research") return null;
  if (!status) return owner === "Anda" ? "Anda belum memiliki tugas akhir yang aktif." : "Mahasiswa belum memiliki tugas akhir yang aktif.";
  return `Aksi ini hanya tersedia untuk tugas akhir berstatus "${THESIS_STATUS_LABELS.research}". Status tugas akhir ${owner} saat ini: "${getThesisStatusLabel(status)}".`;
}
