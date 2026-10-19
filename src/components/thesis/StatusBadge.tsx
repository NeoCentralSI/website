import { cn } from "@/lib/utils";
import { getGuidanceStatusLabel } from "@/lib/thesisLabels";

export type StatusBadgeProps = {
  status: "requested" | "accepted" | "rejected" | "summary_pending" | "completed" | "cancelled" | string;
  className?: string;
};

// Session status colours; labels come from lib/thesisLabels (GUIDANCE_STATUS_LABELS).
// Legacy "rescheduled" is treated exactly like "accepted".
const colorByStatus: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  rescheduled: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-500 text-white border-transparent",
  summary_pending: "bg-purple-100 text-purple-800 border-purple-200",
  summary_rejected: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase();
  const color = colorByStatus[key] || "bg-secondary text-secondary-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {getGuidanceStatusLabel(key)}
    </span>
  );
}
