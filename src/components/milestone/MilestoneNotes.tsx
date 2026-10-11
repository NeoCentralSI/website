import { toTitleCaseName, formatDateTimeWib } from "@/lib/text";

interface MilestoneNotesProps {
  status: string;
  /** Catatan keputusan Pembimbing 1 (setujui / minta revisi). */
  supervisorNotes?: string | null;
  /** Feedback pembimbing (P1/P2); tidak mengubah status. */
  feedback?: string | null;
  feedbackByName?: string | null;
  feedbackAt?: string | null;
  className?: string;
}

/**
 * Paket C (C9): two clearly labelled blocks. "Catatan Persetujuan" (milestone selesai) or
 * "Catatan Revisi" comes from `supervisorNotes`; "Feedback Pembimbing" comes from
 * `feedback` with the lecturer's name and time.
 */
export function MilestoneNotes({ status, supervisorNotes, feedback, feedbackByName, feedbackAt, className }: MilestoneNotesProps) {
  if (!supervisorNotes && !feedback) return null;
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {supervisorNotes && (
        <div className="p-2 rounded-md bg-blue-50/80 border border-blue-100">
          <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">
            {status === "completed" ? "Catatan Persetujuan" : "Catatan Revisi"}
          </p>
          <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">{supervisorNotes}</p>
        </div>
      )}
      {feedback && (
        <div className="p-2 rounded-md bg-amber-50/80 border border-amber-100">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Feedback Pembimbing</p>
          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{feedback}</p>
          {(feedbackByName || feedbackAt) && (
            <p className="mt-1 text-[10px] text-amber-700/80">
              {[feedbackByName ? toTitleCaseName(feedbackByName) : null, feedbackAt ? formatDateTimeWib(feedbackAt) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
