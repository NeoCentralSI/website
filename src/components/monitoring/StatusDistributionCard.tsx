import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatusDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";

interface StatusDistributionCardProps {
  statusDistribution: StatusDistribution[] | undefined;
  isLoading: boolean;
}

// Status color mapping
const statusColors: Record<string, string> = {
  "Bimbingan": "bg-blue-500",
  "Acc Seminar": "bg-amber-500",
  "Seminar Proposal": "bg-purple-500",
  "Revisi Proposal": "bg-orange-500",
  "Penelitian": "bg-cyan-500",
  "Seminar Hasil": "bg-indigo-500",
  "Sidang": "bg-pink-500",
  "Revisi Akhir": "bg-rose-500",
  "Selesai": "bg-green-500",
  "Gagal": "bg-red-500",
};

function getStatusColor(status: string): string {
  return statusColors[status] || "bg-gray-500";
}

export function StatusDistributionCard({ statusDistribution, isLoading }: StatusDistributionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = statusDistribution?.reduce((acc, s) => acc + s.count, 0) ?? 0;

  // Only show statuses with count > 0, sorted by count descending
  const sortedStatuses = [...(statusDistribution ?? [])]
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedStatuses.length === 0 ? (
          <EmptyState 
            size="sm" 
            title="Tidak Ada Data" 
            description="Belum ada data status" 
          />
        ) : (
          sortedStatuses.map((status) => {
            const percentage = total > 0 ? Math.round((status.count / total) * 100) : 0;
            return (
              <div key={status.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{status.name}</span>
                  <span className="text-muted-foreground">
                    {status.count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getStatusColor(status.name)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
