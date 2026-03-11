import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import type { MilestoneProgress } from "@/types/milestone.types";
import { CheckCircle2, AlertCircle, Loader2, Circle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MilestoneProgressCardProps {
  progress: MilestoneProgress | null;
  loading?: boolean;
}

export function MilestoneProgressCard({ progress, loading }: MilestoneProgressCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Loading text="Memuat progress..." size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Circle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada milestone
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Buat milestone pertama untuk melacak progress tugas akhir
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Selesai",
      value: progress.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
      ring: "ring-green-100",
    },
    {
      label: "Dikerjakan",
      value: progress.inProgress,
      icon: Loader2,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      ring: "ring-blue-100",
    },
    {
      label: "Revisi",
      value: progress.revisionNeeded,
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
      ring: "ring-orange-100",
    },
    {
      label: "Belum Mulai",
      value: progress.notStarted,
      icon: Circle,
      color: "text-gray-500",
      bg: "bg-gray-50 border-gray-100",
      ring: "ring-gray-100",
    },
  ];

  const pct = progress.percentComplete;

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5 pb-5 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Progress Milestone</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {progress.completed} dari {progress.total} milestone selesai
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold tracking-tight text-primary">{pct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={pct} className="h-2.5" />
          <p className="text-[11px] text-muted-foreground">
            Rata-rata progress per milestone: {progress.averageProgress}%
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-colors",
                stat.bg
              )}
            >
              <stat.icon className={cn("h-4 w-4 mb-1.5", stat.color)} />
              <span className="text-lg font-bold leading-none">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
