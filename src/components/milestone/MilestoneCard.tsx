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
  ChevronDown,
  ChevronUp,
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
  onStatusChange?: (milestone: Milestone, status: MilestoneStatus) => void;
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
  const [expanded, setExpanded] = useState(false);
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
        "transition-all",
        isCompleted ? "py-6" : "py-8",
        isCompleted && "border-green-200 bg-green-50/30",
        isRevisionNeeded && "border-orange-200 bg-orange-50/30"
      )}
    >
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

        {/* Expandable section */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Supervisor notes - only visible when expanded */}
            {milestone.supervisorNotes && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-medium text-blue-800 mb-1">
                  Catatan Pembimbing:
                </p>
                <p className="text-sm text-blue-700">{milestone.supervisorNotes}</p>
              </div>
            )}

            {/* Progress slider for owner */}
            {isOwner && !isCompleted && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">Ubah Progress</label>
                  <div className="flex items-center gap-1">
                    {!isEditingProgress ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingProgress(true)}
                        className="h-8 w-8 text-muted-foreground"
                        disabled={isProgressUpdating}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelProgressEdit}
                        className="h-8 w-8 text-muted-foreground"
                        disabled={isProgressUpdating}
                      >
                        <X className="h-4 w-4" />
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
                {!isEditingProgress && (
                  <p className="text-xs text-muted-foreground">
                    Klik ikon edit untuk mengubah progress.
                  </p>
                )}
                {isEditingProgress && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelProgressEdit}
                      disabled={isProgressUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProgress}
                      disabled={!progressChanged || isProgressUpdating}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Simpan
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Student notes */}
            {milestone.studentNotes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Catatan Mahasiswa:
                </p>
                <p className="text-sm">{milestone.studentNotes}</p>
              </div>
            )}

            {/* Evidence */}
            {milestone.evidenceUrl && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Bukti:</p>
                <a
                  href={milestone.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {milestone.evidenceDescription || milestone.evidenceUrl}
                </a>
              </div>
            )}

            {/* Linked Guidances */}
            {milestone.guidances && milestone.guidances.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Bimbingan Terkait ({milestone.guidances.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {milestone.guidances.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={g.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {g.status === "completed" ? "Selesai" : g.status === "accepted" ? "Diterima" : "Pending"}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatDateId(g.requestedDate)}
                        </span>
                      </div>
                      {g.supervisor?.user?.fullName && (
                        <span className="text-muted-foreground text-xs">
                          {toTitleCaseName(g.supervisor.user.fullName)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Sembunyikan
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {isCompleted ? "Detail ringkas" : "Detail"}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
