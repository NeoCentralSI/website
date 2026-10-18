import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { TopicDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { MONITORING_CARD_CLASS } from "./MonitoringListCard";

interface TopicDistributionChartProps {
  topicDistribution: TopicDistribution[] | undefined;
  isLoading: boolean;
  /** Paket P9 (6): the same bars for another distribution; defaults are the topic chart's own. */
  title?: string;
  emptyDescription?: string;
  /** Unit in the tooltip ("tugas akhir"). */
  unit?: string;
}

const TOPIC_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e",
  "#ec4899", "#6366f1", "#f97316", "#14b8a6", "#a855f7",
];

export function TopicDistributionChart({
  topicDistribution,
  isLoading,
  title = "Distribusi Topik",
  emptyDescription = "Belum ada data topik",
  unit = "tugas akhir",
}: TopicDistributionChartProps) {
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

  const data = (topicDistribution ?? []).filter(t => t.count > 0);

  const chartConfig: ChartConfig = {
    count: { label: "Jumlah", color: "#3b82f6" },
  };

  // Truncate long topic names for display
  const chartData = data.map((t, i) => ({
    ...t,
    shortName: t.name.length > 20 ? t.name.substring(0, 18) + "..." : t.name,
    fill: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));

  return (
    <Card className={MONITORING_CARD_CLASS}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={emptyDescription} />
        ) : (
          <ChartContainer config={chartConfig} className="h-62.5 w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={100}
                fontSize={11}
                tickLine={false}
              />
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
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {chartData.map((entry, index) => (
                  <rect key={entry.id} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
