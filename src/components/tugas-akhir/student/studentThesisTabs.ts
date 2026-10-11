import { OPEN_THESIS_STATUSES, type ThesisLifecycleStatus } from "@/lib/thesisLabels";

/**
 * Which thesis the tab "Tugas Akhir Saat Ini" shows: the student's latest thesis while it
 * is running (Proposal, Penelitian, Berhenti Studi Sementara) or finished (Selesai). A
 * stopped thesis (Gagal) is never the current one; it is listed under Riwayat.
 */
export function isShownAsCurrentThesis(status: ThesisLifecycleStatus | null | undefined): boolean {
  return !!status && (OPEN_THESIS_STATUSES.includes(status) || status === "completed");
}
