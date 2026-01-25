import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  status: "requested" | "accepted" | "rejected" | "summary_pending" | "completed" | "cancelled" | string;
  className?: string;
};

const colorByStatus: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  summary_pending: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const labelByStatus: Record<string, string> = {
  requested: "Menunggu",
  accepted: "Terjadwal",
  rejected: "Ditolak",
  summary_pending: "Menunggu Approval",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase();
  const color = colorByStatus[key] || "bg-secondary text-secondary-foreground";
  const label = labelByStatus[key] || status;
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}
