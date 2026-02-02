import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RatingDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";

interface RatingDistributionCardProps {
  ratingDistribution: RatingDistribution[] | undefined;
  isLoading: boolean;
}

// Rating color mapping based on thesis progress health
const ratingColors: Record<string, string> = {
  "ONGOING": "bg-green-500",
  "Ongoing": "bg-green-500",
  "SLOW": "bg-yellow-500",
  "Slow": "bg-yellow-500",
  "AT_RISK": "bg-orange-500",
  "At Risk": "bg-orange-500",
  "FAILED": "bg-red-500",
  "Gagal": "bg-red-500",
};

function getRatingColor(rating: string): string {
  return ratingColors[rating] || "bg-gray-500";
}

export function RatingDistributionCard({ ratingDistribution, isLoading }: RatingDistributionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Rating Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
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

  const total = ratingDistribution?.reduce((acc, r) => acc + r.count, 0) ?? 0;

  // Show all ratings (order: ONGOING, SLOW, AT_RISK, FAILED)
  const orderedRatings = ratingDistribution ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Rating Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedRatings.length === 0 || total === 0 ? (
          <EmptyState 
            size="sm" 
            title="Tidak Ada Data" 
            description="Belum ada data rating progress" 
          />
        ) : (
          orderedRatings.map((rating) => {
            const percentage = total > 0 ? Math.round((rating.count / total) * 100) : 0;
            return (
              <div key={rating.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <span 
                      className={`w-2.5 h-2.5 rounded-full ${getRatingColor(rating.value)}`} 
                    />
                    {rating.name}
                  </span>
                  <span className="text-muted-foreground">
                    {rating.count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getRatingColor(rating.value)}`}
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
