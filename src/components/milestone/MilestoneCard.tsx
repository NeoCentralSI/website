import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";
import type { Milestone, MilestoneStatus } from "@/types/milestone.types";
import { formatDateId, toTitleCaseName } from "@/lib/text";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle,
  RotateCcw,
  MessageSquare,
  GripVertical,
  BookOpen,
  Save,
  X,
  Loader2,
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
  const [isEditingProgress, setIsEditingProgress] = useState(false);

  const isCompleted = milestone.status === "completed";
  const isRevisionNeeded = milestone.status === "revision_needed";
  const canStartWorking =
    isOwner && (milestone.status === "not_started" || milestone.status === "revision_needed");
  const canValidate = false;
  const canRequestRevision = isSupervisor && milestone.status === "in_progress";

  const progressChanged = localProgress !== milestone.progressPercentage;

  const deadlineInfo = (() => {
    if (!milestone.targetDate || milestone.status === "completed") return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(milestone.targetDate);
    target.setHours(23, 59, 59, 999);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return { text: `Sisa ${diffDays} hari`, tone: "ok" as const };
    }
    if (diffDays > 1) {
      return { text: `Sisa ${diffDays} hari`, tone: "warn" as const };
    }
    if (diffDays === 1) {
      return { text: "Deadline besok", tone: "warn" as const };
    }
    if (diffDays === 0) {
      return { text: "Deadline hari ini", tone: "urgent" as const };
    }
    return { text: `Terlambat ${Math.abs(diffDays)} hari`, tone: "urgent" as const };
  })();

  useEffect(() => {
    if (!isEditingProgress) {
      setLocalProgress(milestone.progressPercentage);
    }
  }, [milestone.progressPercentage, isEditingProgress]);

  const handleSaveProgress = () => {
    if (progressChanged) {
      onProgressChange?.(milestone, localProgress);
    }
    setIsEditingProgress(false);
  };

  const handleCancelProgressEdit = () => {
    setLocalProgress(milestone.progressPercentage);
    setIsEditingProgress(false);
  };

  return (
    <Card
      className={cn(
        "transition-all relative",
        isCompleted ? "py-6" : "py-8",
        isCompleted && "border-green-200 bg-green-50/30",
        isRevisionNeeded && "border-orange-200 bg-orange-50/30"
      )}
    >
      {isProgressUpdating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg transition-all">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardHeader className={cn("pb-2", isCompleted && "pb-1")}>
        <div className="flex items-start gap-3">
          {draggable && (
            <div className="cursor-grab pt-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold truncate">
                {milestone.title}
              </CardTitle>
              <MilestoneStatusBadge status={milestone.status} />
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {milestone.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-4", isCompleted && "space-y-3")}>
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{milestone.progressPercentage}%</span>
          </div>
          <Progress value={milestone.progressPercentage} className="h-2" />
        </div>

        {/* Progress slider for owner - ALWAYS VISIBLE when not completed */}
        {isOwner && !isCompleted && (
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">Ubah Progress</label>
              <div className="flex items-center gap-1">
                {!isEditingProgress ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingProgress(true)}
                    className="h-8 text-xs"
                    disabled={isProgressUpdating}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelProgressEdit}
                    className="h-8 text-xs"
                    disabled={isProgressUpdating}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Batal
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[localProgress]}
                onValueChange={([val]: [number]) => setLocalProgress(val)}
                max={100}
                step={5}
                className="flex-1"
                disabled={!isEditingProgress || isProgressUpdating}
              />
              <span className="text-sm font-medium w-12 text-right">
                {localProgress}%
              </span>
            </div>
            {isEditingProgress && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleSaveProgress}
                  disabled={!progressChanged || isProgressUpdating}
                  className="text-xs h-8"
                >
                  {isProgressUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  Simpan Progress
                </Button>
              </div>
            )}
            {!isEditingProgress && (
              <p className="text-xs text-muted-foreground">
                💡 Klik tombol Edit untuk mengubah progress milestone ini.
              </p>
            )}
          </div>
        )}

        {/* Timeline info */}
        <div className={cn("flex flex-wrap gap-4 text-sm", isCompleted && "gap-3")}>
          {milestone.targetDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Target: {formatDateId(milestone.targetDate)}</span>
            </div>
          )}
          {milestone.startedAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Mulai: {formatDateId(milestone.startedAt)}</span>
            </div>
          )}
          {milestone.completedAt && (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Selesai: {formatDateId(milestone.completedAt)}</span>
            </div>
          )}
          {deadlineInfo && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1",
                deadlineInfo.tone === "ok" && "bg-green-50 text-green-700 border border-green-200",
                deadlineInfo.tone === "warn" && "bg-amber-50 text-amber-700 border border-amber-200",
                deadlineInfo.tone === "urgent" && "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">{deadlineInfo.text}</span>
            </div>
          )}
        </div>

        {/* Supervisor notes - always visible if exists */}
        {milestone.supervisorNotes && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-medium text-blue-800 mb-1">
              Catatan Pembimbing:
            </p>
            <p className="text-sm text-blue-700">{milestone.supervisorNotes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {/* Owner actions */}
          {isOwner && !isCompleted && (
              <>
                {canStartWorking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange?.(milestone, "in_progress")}
                    disabled={isStatusUpdating}
                  >
                    {isStatusUpdating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-1" />
                    )}
                    Mulai
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit?.(milestone)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                {!milestone.validatedBy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete?.(milestone)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Supervisor actions */}
            {isSupervisor && (
              <>
                {canValidate && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onValidate?.(milestone)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Validasi
                  </Button>
                )}
                {canRequestRevision && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestRevision?.(milestone)}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Minta Revisi
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onAddFeedback?.(milestone)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
