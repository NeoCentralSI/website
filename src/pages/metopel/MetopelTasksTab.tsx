import { useQuery } from "@tanstack/react-query";
import { metopenService } from "@/services/metopen.service";
import { Loading } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { CompactTaskCard } from "@/components/metopen/CompactTaskCard";
import { getApiUrl } from "@/config/api";
import { cn } from "@/lib/utils";

function buildFileUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/uploads/") || filePath.startsWith("uploads/")) {
    return getApiUrl(`/${filePath.replace(/^\//, "")}`);
  }
  return getApiUrl(`/uploads/${filePath}`);
}

export function MetopelTasksTab() {
  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ["metopen-my-tasks"],
    queryFn: () => metopenService.getMyTasks(),
  });

  const { data: gateData, isLoading: isGateLoading } = useQuery({
    queryKey: ["metopen-my-gate-status"],
    queryFn: () => metopenService.getMyGateStatus(),
  });

  if (isTasksLoading || isGateLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" text="Memuat daftar tugas..." />
      </div>
    );
  }

  const tasks = tasksData?.tasks || [];
  const gateOpen = gateData?.gateOpen || false;
  const completedCount = tasks.filter((t: any) => t.status === "completed").length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const overdueCount = tasks.filter((t: any) => {
    const canSubmit = ["in_progress", "revision_needed", "not_started"].includes(t.status);
    return t.targetDate && new Date(t.targetDate) < new Date() && canSubmit;
  }).length;

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground/80">Belum Ada Tugas</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Menunggu dosen pengampu mempublikasikan tugas untuk kelas Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar + stats */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {completedCount} dari {tasks.length} tugas selesai
              </span>
            </div>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              progressPct === 100 ? "text-green-600" : "text-primary"
            )}>
              {progressPct}%
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                progressPct === 100 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {overdueCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{overdueCount} tugas melewati deadline — segera kumpulkan.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {tasks.map((task: any) => (
          <CompactTaskCard
            key={task.id}
            task={task}
            buildFileUrl={buildFileUrl}
            gateOpen={gateOpen}
          />
        ))}
      </div>
    </div>
  );
}
