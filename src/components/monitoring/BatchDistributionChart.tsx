import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { BatchDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";

interface BatchDistributionChartProps {
  batchDistribution: BatchDistribution[] | undefined;
  isLoading: boolean;
}

export function BatchDistributionChart({ batchDistribution, isLoading }: BatchDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi per Angkatan</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = batchDistribution ?? [];

  const chartConfig: ChartConfig = {
    count: { label: "Jumlah TA", color: "#6366f1" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi per Angkatan</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada data angkatan" />
        ) : (
          <ChartContainer config={chartConfig} className="h-62.5 w-full">
            <BarChart data={data} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={11}
                tickLine={false}
              />
              <YAxis allowDecimals={false} fontSize={11} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, props) => (
                      <span>{props.payload?.name}: {value} tugas akhir</span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
