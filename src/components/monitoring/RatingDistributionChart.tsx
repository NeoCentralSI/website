import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import type { RatingDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";

interface RatingDistributionChartProps {
  ratingDistribution: RatingDistribution[] | undefined;
  isLoading: boolean;
}

const RATING_COLORS: Record<string, string> = {
  ONGOING: "#22c55e",
  Ongoing: "#22c55e",
  SLOW: "#eab308",
  Slow: "#eab308",
  AT_RISK: "#f97316",
  "At Risk": "#f97316",
  FAILED: "#ef4444",
  Gagal: "#ef4444",
  CANCELLED: "#64748b",
  Cancelled: "#64748b",
};

function getColor(rating: string, index: number): string {
  return RATING_COLORS[rating] || `hsl(${index * 90}, 70%, 50%)`;
}

export function RatingDistributionChart({ ratingDistribution, isLoading }: RatingDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi Rating Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = ratingDistribution ?? [];
  const total = data.reduce((sum, r) => sum + r.count, 0);

  const chartConfig: ChartConfig = {};
  data.forEach((r, i) => {
    chartConfig[r.name] = { label: r.name, color: getColor(r.value, i) };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi Rating Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada data rating" />
        ) : (
          <ChartContainer config={chartConfig} className="h-62.5 w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>{name}: {value} ({total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)</span>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={11}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.id} fill={getColor(entry.value, index)} />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
