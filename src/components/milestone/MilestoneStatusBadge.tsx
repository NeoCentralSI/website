import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MilestoneStatus } from "@/types/milestone.types";
import { MILESTONE_STATUS_CONFIG } from "@/types/milestone.types";
import { Circle, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
  showIcon?: boolean;
}

const IconByStatus: Record<MilestoneStatus, React.ElementType> = {
  not_started: Circle,
  in_progress: Loader2,
  pending_review: Clock,
  revision_needed: AlertTriangle,
  completed: CheckCircle2,
};

const variantByStatus: Record<MilestoneStatus, "default" | "secondary" | "destructive" | "outline" | "warning" | "success" | "info"> = {
  not_started: "secondary",
  in_progress: "info",
  pending_review: "warning",
  revision_needed: "destructive",
  completed: "success",
};

export function MilestoneStatusBadge({
  status,
  className,
  showIcon = true,
}: MilestoneStatusBadgeProps) {
  const config = MILESTONE_STATUS_CONFIG[status] || MILESTONE_STATUS_CONFIG.not_started;
  const Icon = (status && IconByStatus[status]) ? IconByStatus[status] : IconByStatus.not_started;
  const variant = variantByStatus[status] || "secondary";

  return (
    <Badge variant={variant} className={className}>
      {showIcon && Icon && <Icon className={cn("h-3 w-3 mr-1.5", status === "in_progress" && "animate-spin")} />}
      {config.label}
    </Badge>
  );
}
