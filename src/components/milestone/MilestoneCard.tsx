import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";

import { MilestoneStatusBadge } from "./MilestoneStatusBadge";
import type { Milestone, MilestoneStatus } from "@/types/milestone.types";
import { formatDateId } from "@/lib/text";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  RotateCcw,
  MessageSquare,
  GripVertical,
  Play,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MilestoneCardProps {
  milestone: Milestone;
  isOwner?: boolean;
  isSupervisor?: boolean;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  onStatusChange?: (milestone: Milestone, status: Exclude<MilestoneStatus, "completed">) => void;
  onProgressChange?: (milestone: Milestone, progress: number) => void;
  onValidate?: (milestone: Milestone) => void;
  onRequestRevision?: (milestone: Milestone) => void;
  onAddFeedback?: (milestone: Milestone) => void;
  draggable?: boolean;
  isProgressUpdating?: boolean;
  isStatusUpdating?: boolean;
}

export function MilestoneCard({
  milestone,
  isOwner = false,
  isSupervisor = false,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressChange,
  onValidate,
  onRequestRevision,
  onAddFeedback,
  draggable = false,
  isProgressUpdating = false,
  isStatusUpdating = false,
}: MilestoneCardProps) {
  const [localProgress, setLocalProgress] = useState(milestone.progressPercentage);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isCompleted = milestone.status === "completed";
  const isRevisionNeeded = milestone.status === "revision_needed";
  const isInProgress = milestone.status === "in_progress";
  const isPendingReview = milestone.status === "pending_review";
  const canStartWorking =
    isOwner && (milestone.status === "not_started" || milestone.status === "revision_needed" || milestone.status === "pending_review");
  const canValidate = isSupervisor && (milestone.status === "pending_review" || (milestone.status === "in_progress" && milestone.progressPercentage === 100));
  const canRequestRevision = isSupervisor && (milestone.status === "in_progress" || milestone.status === "pending_review");

  const progressChanged = localProgress !== milestone.progressPercentage;

  const deadlineInfo = (() => {
    if (!milestone.targetDate || isCompleted) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(milestone.targetDate);
    target.setHours(23, 59, 59, 999);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return { text: `${diffDays} hari lagi`, tone: "ok" as const };
    if (diffDays > 1) return { text: `${diffDays} hari lagi`, tone: "warn" as const };
    if (diffDays === 1) return { text: "Besok", tone: "warn" as const };
    if (diffDays === 0) return { text: "Hari ini!", tone: "urgent" as const };
    return { text: `Terlambat ${Math.abs(diffDays)} hari`, tone: "urgent" as const };
  })();

  useEffect(() => {
    if (!showProgressSlider) {
      setLocalProgress(milestone.progressPercentage);
    }
  }, [milestone.progressPercentage, showProgressSlider]);

  const handleSaveProgress = () => {
    if (progressChanged) {
      onProgressChange?.(milestone, localProgress);
    }
    setShowProgressSlider(false);
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card transition-all hover:shadow-sm",
        isCompleted && "border-green-200/70 bg-green-50/30",
        isRevisionNeeded && "border-orange-200/70 bg-orange-50/30",
        isPendingReview && "border-amber-200/70 bg-amber-50/30",
        isInProgress && "border-blue-200/70",
        !isCompleted && !isRevisionNeeded && !isInProgress && "border-border/60",
        isProgressUpdating && "opacity-60"
      )}
    >
      {/* Loading overlay */}
      {isProgressUpdating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Main content */}
      <div className="px-3.5 py-3">
        {/* Top row: drag + title + badge + actions */}
        <div className="flex items-center gap-2">
          {draggable && (
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
          )}
          <h4
            className={cn(
              "text-sm font-medium flex-1 min-w-0 truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {milestone.title}
          </h4>
          <MilestoneStatusBadge status={milestone.status} className="shrink-0" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Progress + meta row */}
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Progress value={milestone.progressPercentage} className="h-1.5" />
          </div>
          <span className={cn(
            "text-xs font-semibold tabular-nums shrink-0",
            isCompleted ? "text-green-600" : isInProgress ? "text-blue-600" : "text-muted-foreground"
          )}>
            {milestone.progressPercentage}%
          </span>
        </div>

        {/* Meta chips */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {milestone.targetDate && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {formatDateId(milestone.targetDate)}
            </span>
          )}
          {deadlineInfo && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5",
                deadlineInfo.tone === "ok" && "bg-green-50 text-green-700",
                deadlineInfo.tone === "warn" && "bg-amber-50 text-amber-700",
                deadlineInfo.tone === "urgent" && "bg-red-50 text-red-700"
              )}
            >
              <Clock className="h-2.5 w-2.5" />
              {deadlineInfo.text}
            </span>
          )}
          {milestone.supervisorNotes && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600">
              <MessageSquare className="h-2.5 w-2.5" />
              Catatan
            </span>
          )}
          {/* Inline quick actions */}
          {isOwner && canStartWorking && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange?.(milestone, "in_progress")}
              disabled={isStatusUpdating}
              className="h-5 text-[10px] px-2 gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 ml-auto"
            >
              {isStatusUpdating ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Play className="h-2.5 w-2.5" />
              )}
              Mulai
            </Button>
          )}
          {isOwner && isInProgress && !showProgressSlider && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProgressSlider(true)}
              className="h-5 text-[10px] px-2 gap-1 ml-auto"
              disabled={isProgressUpdating}
            >
              <Edit2 className="h-2.5 w-2.5" />
              Update
            </Button>
          )}
        </div>
      </div>

      {/* Progress slider - expandable */}
      {showProgressSlider && isOwner && !isCompleted && (
        <div className="mx-3.5 mb-3 p-2.5 rounded-md bg-muted/50 border space-y-2 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <Slider
              value={[localProgress]}
              onValueChange={([val]: [number]) => setLocalProgress(val)}
              max={100}
              step={5}
              className="flex-1"
              disabled={isProgressUpdating}
            />
            <span className="text-xs font-bold w-10 text-right tabular-nums">
              {localProgress}%
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalProgress(milestone.progressPercentage);
                setShowProgressSlider(false);
              }}
              className="h-6 text-[11px] px-2"
              disabled={isProgressUpdating}
            >
              <X className="h-2.5 w-2.5 mr-1" />
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProgress}
              disabled={!progressChanged || isProgressUpdating}
              className="h-6 text-[11px] px-2"
            >
              {isProgressUpdating ? (
                <Spinner className="h-2.5 w-2.5 mr-1" />
              ) : (
                <Save className="h-2.5 w-2.5 mr-1" />
              )}
              Simpan
            </Button>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {showDetails && (
        <div className="border-t mx-3.5 pt-2.5 pb-3 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
          {/* Description */}
          {milestone.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {milestone.description}
            </p>
          )}

          {/* Timeline dates */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {milestone.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Mulai: {formatDateId(milestone.startedAt)}
              </span>
            )}
            {milestone.completedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Selesai: {formatDateId(milestone.completedAt)}
              </span>
            )}
          </div>

          {/* Supervisor notes */}
          {milestone.supervisorNotes && (
            <div className="p-2 rounded-md bg-blue-50/80 border border-blue-100">
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">
                Catatan Pembimbing
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                {milestone.supervisorNotes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 pt-0.5">
            {isOwner && !isCompleted && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(milestone)}
                  className="h-6 text-[11px] px-2 gap-1"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                  Edit
                </Button>
                {milestone.status === "not_started" && !milestone.validatedBy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(milestone)}
                    className="h-6 text-[11px] px-2 gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    Hapus
                  </Button>
                )}
              </>
            )}
            {isSupervisor && (
              <>
                {canValidate && (
                  <Button
                    size="sm"
                    onClick={() => onValidate?.(milestone)}
                    className="h-6 text-[11px] px-2 gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-2.5 w-2.5" />
                    Validasi
                  </Button>
                )}
                {canRequestRevision && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestRevision?.(milestone)}
                    className="h-6 text-[11px] px-2 gap-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Revisi
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddFeedback?.(milestone)}
                  className="h-6 text-[11px] px-2 gap-1"
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  Feedback
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
