import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/milestone.types";
import { MILESTONE_STATUS_CONFIG } from "@/types/milestone.types";
import { Circle, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
  showIcon?: boolean;
}

const IconByStatus: Record<MilestoneStatus, React.ElementType> = {
  not_started: Circle,
  in_progress: Loader2,
  revision_needed: AlertTriangle,
  completed: CheckCircle2,
};

export function MilestoneStatusBadge({
  status,
  className,
  showIcon = true,
}: MilestoneStatusBadgeProps) {
  const config = MILESTONE_STATUS_CONFIG[status] || MILESTONE_STATUS_CONFIG.not_started;
  const Icon = (status && IconByStatus[status]) ? IconByStatus[status] : IconByStatus.not_started;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn("h-3 w-3", status === "in_progress" && "animate-spin")} />}
      {config.label}
    </span>
  );
}
