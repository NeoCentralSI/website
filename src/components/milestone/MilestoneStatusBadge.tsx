import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/milestone.types";
import { MILESTONE_STATUS_CONFIG } from "@/types/milestone.types";

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
  showIcon?: boolean;
}

const iconByStatus: Record<MilestoneStatus, string> = {
  not_started: "○",
  in_progress: "◐",
  pending_review: "◑",
  revision_needed: "⟳",
  completed: "●",
};

export function MilestoneStatusBadge({
  status,
  className,
  showIcon = true,
}: MilestoneStatusBadgeProps) {
  const config = MILESTONE_STATUS_CONFIG[status] || MILESTONE_STATUS_CONFIG.not_started;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {showIcon && <span>{iconByStatus[status]}</span>}
      {config.label}
    </span>
  );
}
