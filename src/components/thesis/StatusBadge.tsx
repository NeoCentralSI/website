import { Badge } from "@/components/ui/badge";

export type StatusBadgeProps = {
  status: "requested" | "accepted" | "rejected" | "summary_pending" | "completed" | "cancelled" | string;
  className?: string;
};

const variantByStatus: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning" | "success" | "info"> = {
  requested: "warning", // Maps to primary/10
  accepted: "info", // Maps to blue-100
  rejected: "destructive",
  summary_pending: "default", // Maps to purple/primary
  completed: "success", // Maps to green-100
  cancelled: "secondary", // Maps to gray-100
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
  const variant = variantByStatus[key] || "secondary";
  const label = labelByStatus[key] || status;

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
