import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  status: "scheduled" | "completed" | "cancelled" | "rejected" | string;
  className?: string;
};

const colorByStatus: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = String(status || "").toLowerCase();
  const color = colorByStatus[key] || "bg-secondary text-secondary-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        color,
        className
      )}
    >
      {status}
    </span>
  );
}
