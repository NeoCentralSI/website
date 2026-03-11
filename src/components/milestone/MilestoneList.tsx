import { useEffect, useRef, useState } from "react";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneProgressCard } from "./MilestoneProgressCard";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Milestone, MilestoneProgress, MilestoneStatus } from "@/types/milestone.types";
import { MILESTONE_STATUS_CONFIG } from "@/types/milestone.types";
import { Plus, Search, Filter, LayoutGrid, List, Loader2, Edit3, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to get timeline dot color for a milestone status
function getTimelineDotClasses(status: MilestoneStatus) {
  switch (status) {
    case "completed":
      return "bg-green-500 ring-green-200";
    case "in_progress":
      return "bg-blue-500 ring-blue-200 animate-pulse";
    case "revision_needed":
      return "bg-orange-400 ring-orange-200";
    default:
      return "bg-gray-300 ring-gray-100";
  }
}

function TimelineDot({ status }: { status: MilestoneStatus }) {
  const isCompleted = status === "completed";
  const isRevision = status === "revision_needed";

  return (
    <div
      className={cn(
        "relative z-10 flex items-center justify-center h-7 w-7 rounded-full ring-4 bg-background",
        getTimelineDotClasses(status)
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
      ) : isRevision ? (
        <AlertTriangle className="h-3 w-3 text-white" />
      ) : (
        <div className={cn(
          "h-2 w-2 rounded-full",
          status === "in_progress" ? "bg-white" : "bg-white/80"
        )} />
      )}
    </div>
  );
}

export interface MilestoneListProps {
  milestones: Milestone[];
  progress: MilestoneProgress | null;
  isLoading?: boolean;
  isOwner?: boolean;
  isSupervisor?: boolean;
  onCreateNew?: () => void;
  onCreateFromTemplates?: () => void;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  onStatusChange?: (milestone: Milestone, status: Exclude<MilestoneStatus, "completed">) => void;
  onProgressChange?: (milestone: Milestone, progress: number) => void;
  onValidate?: (milestone: Milestone) => void;
  onRequestRevision?: (milestone: Milestone) => void;
  onAddFeedback?: (milestone: Milestone) => void;
  isProgressUpdating?: boolean;
  progressUpdatingId?: string | null;
  statusUpdatingId?: string | null;
  onReorder?: (orders: { id: string; orderIndex: number }[]) => void;
  isReordering?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (milestoneId: string) => void;
  onClearSelection?: () => void;
  onBulkStart?: () => void;
  isBulkStarting?: boolean;
}

export function MilestoneList({
  milestones,
  progress,
  isLoading,
  isOwner = false,
  isSupervisor = false,
  onCreateNew,
  onCreateFromTemplates,
  onEdit,
  onDelete,
  onStatusChange,
  onProgressChange,
  onValidate,
  onRequestRevision,
  onAddFeedback,
  isProgressUpdating = false,
  progressUpdatingId = null,
  statusUpdatingId = null,
  onReorder,
  isReordering = false,
  selectedIds = [],
  onToggleSelect,
  onClearSelection,
  onBulkStart,
  isBulkStarting = false,
}: MilestoneListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [orderedMilestones, setOrderedMilestones] = useState<Milestone[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const selectedCount = selectedIds?.length ?? 0;
  const wasReorderingRef = useRef(false);

  // Reset edit mode when reorder completes successfully
  useEffect(() => {
    if (wasReorderingRef.current && !isReordering) {
      // Reorder just completed
      setEditMode(false);
      setReorderEnabled(false);
      setHasReordered(false);
      setDraggingId(null);
      onClearSelection?.();
    }
    wasReorderingRef.current = isReordering;
  }, [isReordering, onClearSelection]);

  // Keep local ordered state in sync with incoming data
  useEffect(() => {
    // Keep non-completed milestones at the top (in their orderIndex order) and push completed ones to the bottom
    const sorted = [...milestones].sort((a, b) => {
      const aCompleted = a.status === "completed";
      const bCompleted = b.status === "completed";
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      return a.orderIndex - b.orderIndex;
    });
    setOrderedMilestones(sorted);
    if (!reorderEnabled) {
      setDraggingId(null);
      setHasReordered(false);
    }
  }, [milestones, reorderEnabled]);

  // Filter milestones
  const filteredMilestones = orderedMilestones.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const enableReorder = isOwner && !!onReorder && reorderEnabled && !isReordering;
  const startableIds = new Set(
    orderedMilestones.filter((m) => m.status === "not_started").map((m) => m.id)
  );

  const handleDragStart = (milestoneId: string) => {
    if (!enableReorder) return;
    setDraggingId(milestoneId);
  };

  const handleDragOver = (event: React.DragEvent, targetId: string) => {
    if (!enableReorder) return;
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setOrderedMilestones((prev) => {
      const currentIndex = prev.findIndex((m) => m.id === draggingId);
      const targetIndex = prev.findIndex((m) => m.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setHasReordered(true);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleSaveOrder = () => {
    if (!onReorder) return;
    const payload = orderedMilestones.map((m, idx) => ({
      id: m.id,
      orderIndex: idx,
    }));
    onReorder(payload);
    setHasReordered(false);
  };

  const toggleEditMode = () => {
    setEditMode((prev) => {
      const next = !prev;
      if (!next) {
        setReorderEnabled(false);
        setHasReordered(false);
        setDraggingId(null);
        onClearSelection?.();
      } else {
        setReorderEnabled(true);
      }
      return next;
    });
  };

  // Ensure reorder flag follows edit mode
  useEffect(() => {
    setReorderEnabled(editMode);
    if (!editMode) {
      setHasReordered(false);
    }
  }, [editMode]);

  const showCheckboxes = isOwner && editMode && !!onToggleSelect;

  // Drop any selection that is no longer startable when data refreshes
  useEffect(() => {
    if (!selectedIds?.length) return;
    const stillValid = selectedIds.filter((id) => startableIds.has(id));
    if (stillValid.length !== selectedIds.length) {
      onClearSelection?.();
    }
  }, [selectedIds, startableIds, onClearSelection]);

  // Loading state
  if (isLoading) {
    return <Loading text="Memuat milestone..." />;
  }

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <MilestoneProgressCard progress={progress} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari milestone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as MilestoneStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(MILESTONE_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && editMode && onBulkStart && selectedCount > 0 && (
            <Button
              size="sm"
              onClick={onBulkStart}
              disabled={isBulkStarting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isBulkStarting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mulai {selectedCount} Milestone
            </Button>
          )}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {isOwner && milestones.length === 0 && (
            <Button onClick={onCreateFromTemplates}>
              <Plus className="h-4 w-4 mr-2" />
              Buat dari Template
            </Button>
          )}
          {isOwner && milestones.length > 0 && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Milestone
            </Button>
          )}
          {isOwner && milestones.length > 0 && (
            <Button
              variant={editMode ? "secondary" : "outline"}
              size="icon"
              onClick={toggleEditMode}
              disabled={isReordering}
              title={editMode ? "Selesai edit" : "Edit urutan & mulai banyak"}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          {reorderEnabled && (
            <Button
              size="sm"
              onClick={handleSaveOrder}
              disabled={!hasReordered || isReordering}
            >
              {isReordering && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Urutan
            </Button>
          )}
        </div>
      </div>

      {reorderEnabled && (
        <p className="text-xs text-muted-foreground">
          Mode edit aktif: drag & drop kartu untuk mengubah urutan, centang milestone berstatus Belum Mulai lalu klik "Mulai" untuk memulai bersama.
        </p>
      )}

      {/* Empty state */}
      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Belum ada milestone</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Milestone membantu Anda melacak progress tugas akhir dengan lebih terstruktur.
            Mulai dengan membuat milestone dari template atau buat manual.
          </p>
          {isOwner && (
            <div className="flex gap-3">
              <Button onClick={onCreateFromTemplates}>
                <Plus className="h-4 w-4 mr-2" />
                Buat dari Template
              </Button>
              <Button variant="outline" onClick={onCreateNew}>
                Buat Manual
              </Button>
            </div>
          )}
        </div>
      ) : filteredMilestones.length === 0 ? (
        <EmptyState 
          size="sm" 
          title="Tidak Ditemukan" 
          description="Tidak ada milestone yang sesuai dengan filter" 
        />
      ) : (
        <div className="relative">
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-3"
                : "relative"
            }
          >
            {/* Timeline vertical line (only in list view) */}
            {viewMode === "list" && filteredMilestones.length > 1 && (
              <div className="absolute left-3.25 top-4 bottom-4 w-0.5 bg-border" />
            )}

            {filteredMilestones.map((milestone, index) => (
              <div key={milestone.id} className={cn(
                "relative",
                viewMode === "list" && "flex gap-3"
              )}>
                {/* Timeline dot (list view only) */}
                {viewMode === "list" && (
                  <div className="flex flex-col items-center shrink-0 pt-3">
                    <TimelineDot status={milestone.status} />
                    {index < filteredMilestones.length - 1 && (
                      <div className="flex-1" />
                    )}
                  </div>
                )}

                {/* Card content */}
                <div className={cn("flex-1 min-w-0", viewMode === "list" && "pb-3")}>
                  {showCheckboxes && (
                    <div className="absolute z-10 right-2 top-2">
                      <input
                        type="checkbox"
                        checked={selectedIds?.includes(milestone.id)}
                        onChange={() => {
                          if (!startableIds.has(milestone.id)) return;
                          onToggleSelect(milestone.id);
                        }}
                        disabled={!startableIds.has(milestone.id)}
                        className="h-4 w-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                  <div
                    draggable={enableReorder}
                    onDragStart={() => handleDragStart(milestone.id)}
                    onDragOver={(event) => handleDragOver(event, milestone.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDragEnd();
                    }}
                    className={cn(
                      enableReorder && "cursor-grab",
                      draggingId === milestone.id && "opacity-75",
                      selectedIds?.includes(milestone.id) && "ring-2 ring-primary/60 rounded-lg"
                    )}
                  >
                    <MilestoneCard
                      milestone={milestone}
                      isOwner={isOwner}
                      isSupervisor={isSupervisor}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onProgressChange={onProgressChange}
                      onValidate={onValidate}
                      onRequestRevision={onRequestRevision}
                      onAddFeedback={onAddFeedback}
                      isProgressUpdating={
                        progressUpdatingId
                          ? progressUpdatingId === milestone.id
                          : isProgressUpdating
                      }
                      isStatusUpdating={statusUpdatingId === milestone.id}
                      draggable={enableReorder}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isReordering && (
            <div className="absolute inset-0 flex items-start justify-center pt-6 bg-background/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
