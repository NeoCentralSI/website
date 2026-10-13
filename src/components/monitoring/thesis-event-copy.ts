import type { EventAttentionReason, ThesisEventKind } from "@/services/monitoring.service";

/** Words of the Seminar Hasil and Sidang tabs that differ between the two. */
export const THESIS_EVENT_COPY: Record<ThesisEventKind, {
  /** "seminar hasil" / "sidang", for use inside a sentence. */
  noun: string;
  readyBadge: string;
  loadError: string;
}> = {
  seminar: { noun: "seminar hasil", readyBadge: "Acc Seminar", loadError: "Data seminar hasil gagal dimuat." },
  defence: { noun: "sidang", readyBadge: "Acc Sidang", loadError: "Data sidang gagal dimuat." },
};

/** What the waiting days of a "Perlu Perhatian" row are counted from. */
export const ATTENTION_SINCE_TEXT: Record<EventAttentionReason, string> = {
  document_verification: "sejak mendaftar",
  scheduling: "sejak diverifikasi",
  result_finalization: "sejak pelaksanaan",
  revision: "sejak hasil difinalkan",
};
