import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MilestoneProgress } from "@/types/milestone.types";
import { CheckCircle2, AlertCircle, Loader2, Circle } from "lucide-react";

export interface MilestoneProgressCardProps {
  progress: MilestoneProgress | null;
  loading?: boolean;
}

export function MilestoneProgressCard({ progress, loading }: MilestoneProgressCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progress Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progress Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Belum ada milestone. Buat milestone pertama Anda untuk memulai tracking progress.
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
      bg: "bg-green-50",
    },
    {
      label: "Dikerjakan",
      value: progress.inProgress,
      icon: Loader2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Revisi",
      value: progress.revisionNeeded,
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Belum Mulai",
      value: progress.notStarted,
      icon: Circle,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Progress Milestone</span>
          <span className="text-2xl font-bold text-primary">
            {progress.percentComplete}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Progress value={progress.percentComplete} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {progress.completed} dari {progress.total} milestone selesai •{" "}
              Rata-rata progress: {progress.averageProgress}%
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center p-3 rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                <span className="text-xl font-semibold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
