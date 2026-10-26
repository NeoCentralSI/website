import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { BatchDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { MONITORING_CARD_CLASS } from "./MonitoringListCard";

interface BatchDistributionChartProps {
  batchDistribution: BatchDistribution[] | undefined;
  isLoading: boolean;
  /** The same bars for another cohort distribution (Yudisium); defaults are Monitoring's own. */
  title?: string;
  emptyDescription?: string;
  /** Unit in the tooltip ("tugas akhir"). */
  unit?: string;
  /** Bar colour; Monitoring keeps its indigo. */
  color?: string;
}

export function BatchDistributionChart({
  batchDistribution,
  isLoading,
  title = "Distribusi per Angkatan",
  emptyDescription = "Belum ada data angkatan",
  unit = "tugas akhir",
  color = "#6366f1",
}: BatchDistributionChartProps) {
  if (isLoading) {
    return (
      <Card className={MONITORING_CARD_CLASS}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = batchDistribution ?? [];

  const chartConfig: ChartConfig = {
    count: { label: "Jumlah TA", color },
  };

  return (
    <Card className={MONITORING_CARD_CLASS}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={emptyDescription} />
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
                      <span>{props.payload?.name}: {value} {unit}</span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill={color}
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
