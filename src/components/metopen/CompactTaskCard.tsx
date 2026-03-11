import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  ChevronDown,
  FileText,
  Paperclip,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { StudentTaskSubmitDialog } from "@/components/metopen/StudentTaskSubmitDialog";
import { cn } from "@/lib/utils";
import type { MetopenTask } from "@/types/metopen.types";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock; accent: string }
> = {
  not_started: { label: "Belum Dimulai", variant: "secondary", icon: Clock, accent: "border-l-muted-foreground/30" },
  in_progress: { label: "Dikerjakan", variant: "default", icon: Clock, accent: "border-l-blue-500" },
  pending_review: { label: "Menunggu Review", variant: "outline", icon: AlertTriangle, accent: "border-l-amber-500" },
  revision_needed: { label: "Perlu Revisi", variant: "destructive", icon: AlertTriangle, accent: "border-l-red-500" },
  completed: { label: "Selesai", variant: "secondary", icon: CheckCircle2, accent: "border-l-green-500" },
};

interface CompactTaskCardProps {
  task: MetopenTask;
  buildFileUrl: (path: string | null | undefined) => string | null;
  gateOpen: boolean;
}

export function CompactTaskCard({ task, buildFileUrl, gateOpen: _gateOpen }: CompactTaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const status = STATUS_MAP[task.status] ?? STATUS_MAP.not_started;
  const StatusIcon = status.icon;
  const canSubmit = ["in_progress", "revision_needed", "not_started"].includes(task.status);
  const isCompleted = task.status === "completed";
  const isPendingReview = task.status === "pending_review";

  const isGate = task.milestoneTemplate?.isGateToAdvisorSearch;

  const overdue =
    task.targetDate && new Date(task.targetDate) < new Date() && canSubmit;

  const deadline = task.targetDate
    ? format(new Date(task.targetDate), "d MMM yyyy", { locale: localeId })
    : null;

  const latestDoc =
    task.milestoneDocuments?.find((d: any) => d.isLatest) ??
    task.milestoneDocuments?.[0] ??
    null;
  const milestoneDocuments = task.milestoneDocuments ?? [];

  const templateAttachments: any[] =
    task.milestoneTemplate?.attachments ?? [];

  return (
    <>
      {/* ─── Main row ─── */}
      <div
        className={cn(
          "group border border-l-4 rounded-lg bg-card transition-colors",
          status.accent,
          expanded && "ring-1 ring-ring/10"
        )}
      >
        {/* Top bar */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left px-4 py-3 flex items-start gap-3"
        >
          {/* Number circle */}
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              isCompleted
                ? "bg-green-100 text-green-700"
                : isPendingReview
                  ? "bg-amber-100 text-amber-700"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              task.orderIndex ?? "–"
            )}
          </span>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "text-sm font-semibold leading-snug truncate",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>
              {isGate && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 border-primary/30 text-primary">
                  Gate
                </Badge>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant={status.variant} className="text-[10px] h-5 gap-1 font-medium">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>

              {deadline && (
                <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-medium")}>
                  <Clock className="h-3 w-3" />
                  {deadline}
                  {overdue && " (terlambat)"}
                </span>
              )}

              {templateAttachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {templateAttachments.length} lampiran
                </span>
              )}
            </div>
          </div>

          {/* Right side: score or action hint */}
          <div className="flex items-center gap-2 shrink-0">
            {task.totalScore != null && (
              <span className="text-lg font-bold tabular-nums text-green-600">
                {task.totalScore}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* ─── Expanded panel ─── */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4 animate-in fade-in-0 slide-in-from-top-1 duration-150">

            {/* Instruksi */}
            {task.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Instruksi</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Lampiran dari dosen (template attachments) */}
            {templateAttachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Lampiran dari Dosen</p>
                <div className="flex flex-wrap gap-2">
                  {templateAttachments.map((att: any) => {
                    const doc = att.document;
                    const url = buildFileUrl(doc?.filePath);
                    return (
                      <a
                        key={att.id}
                        href={url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border bg-muted/50 hover:bg-muted transition-colors max-w-[220px]"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{doc?.fileName || "Dokumen"}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback dosen */}
            {task.feedback && (
              <div className="bg-muted/40 rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Feedback Dosen
                </p>
                <p className="text-sm italic">&ldquo;{task.feedback}&rdquo;</p>
              </div>
            )}

            {!task.feedback && (isCompleted || isPendingReview) && (
              <p className="text-xs text-muted-foreground italic">
                Belum ada feedback dari dosen.
              </p>
            )}

            {/* File yang sudah dikumpulkan mahasiswa */}
            {milestoneDocuments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">File Terkumpul</p>
                <div className="space-y-1">
                  {milestoneDocuments.map((doc: any, i: number) => {
                    const url = buildFileUrl(doc.filePath);
                    return (
                      <a
                        key={doc.id || i}
                        href={url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md border hover:bg-muted/50 transition-colors",
                          doc.isLatest && "border-primary/30 bg-primary/5"
                        )}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{doc.fileName || `Dokumen V${doc.version || i + 1}`}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                          {doc.isLatest && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1">Terbaru</Badge>
                          )}
                          <span className="text-[10px]">
                            {format(new Date(doc.createdAt), "d MMM, HH:mm", { locale: localeId })}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {latestDoc && buildFileUrl(latestDoc.filePath) && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                  <a
                    href={buildFileUrl(latestDoc.filePath)!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Lihat Terakhir
                  </a>
                </Button>
              )}

              {canSubmit && (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setSubmitOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Kumpulkan
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <StudentTaskSubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        task={task}
      />
    </>
  );
}
