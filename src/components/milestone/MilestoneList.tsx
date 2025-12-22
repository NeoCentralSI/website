import { useState } from "react";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneProgressCard } from "./MilestoneProgressCard";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";

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
  onStatusChange?: (milestone: Milestone, status: MilestoneStatus) => void;
  onProgressChange?: (milestone: Milestone, progress: number) => void;
  onSubmitReview?: (milestone: Milestone) => void;
  onValidate?: (milestone: Milestone) => void;
  onRequestRevision?: (milestone: Milestone) => void;
  onAddFeedback?: (milestone: Milestone) => void;
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
  onSubmitReview,
  onValidate,
  onRequestRevision,
  onAddFeedback,
}: MilestoneListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filter milestones
  const filteredMilestones = milestones.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <MilestoneProgressCard progress={null} loading />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
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
        </div>
      </div>

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
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada milestone yang sesuai dengan filter
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-4"
          }
        >
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              isOwner={isOwner}
              isSupervisor={isSupervisor}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onProgressChange={onProgressChange}
              onSubmitReview={onSubmitReview}
              onValidate={onValidate}
              onRequestRevision={onRequestRevision}
              onAddFeedback={onAddFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}
