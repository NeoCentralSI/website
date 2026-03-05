import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ProgressBucket } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";

interface ProgressDistributionChartProps {
  progressDistribution: ProgressBucket[] | undefined;
  isLoading: boolean;
}

const PROGRESS_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function ProgressDistributionChart({ progressDistribution, isLoading }: ProgressDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi Progress Milestone</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = progressDistribution ?? [];
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const chartConfig: ChartConfig = {
    count: { label: "Jumlah Mahasiswa", color: "#3b82f6" },
  };

  const chartData = data.map((d, i) => ({
    ...d,
    fill: PROGRESS_COLORS[i % PROGRESS_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi Progress Milestone</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada data progress" />
        ) : (
          <ChartContainer config={chartConfig} className="h-62.5 w-full">
            <BarChart data={chartData} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={11} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span>{value} mahasiswa</span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
