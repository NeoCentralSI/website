import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import type { ActivityDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { THESIS_ACTIVITY_CHART_COLORS, getThesisActivityLabel, type ThesisActivityLevel } from "@/lib/thesisLabels";
import { MONITORING_CARD_CLASS } from "./MonitoringListCard";

interface ActivityDistributionChartProps {
  activityDistribution: ActivityDistribution[] | undefined;
  isLoading: boolean;
  /**
   * Paket P9 (6): the same pie for another distribution (Kelola → Batas Bimbingan). Defaults are
   * the activity chart's own title, labels, colours and empty text.
   */
  title?: string;
  emptyDescription?: string;
  labelOf?: (value: string) => string;
  colorOf?: (value: string) => string | undefined;
}

function getColor(level: string, index: number): string {
  return THESIS_ACTIVITY_CHART_COLORS[level as ThesisActivityLevel] || `hsl(${index * 90}, 70%, 50%)`;
}

/** Sebaran tingkat aktivitas TA berstatus Penelitian (Lancar / Lambat / Berisiko). */
export function ActivityDistributionChart({
  activityDistribution,
  isLoading,
  title = "Distribusi Aktivitas",
  emptyDescription = "Belum ada tugas akhir berstatus Penelitian",
  labelOf = getThesisActivityLabel,
  colorOf,
}: ActivityDistributionChartProps) {
  const colorFor = (value: string, index: number) => colorOf?.(value) ?? getColor(value, index);
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

  // Label from the enum value (single source: lib/thesisLabels).
  const data = (activityDistribution ?? []).map((r) => ({ ...r, name: labelOf(r.value) }));
  const total = data.reduce((sum, r) => sum + r.count, 0);

  const chartConfig: ChartConfig = {};
  data.forEach((r, i) => {
    chartConfig[r.name] = { label: r.name, color: colorFor(r.value, i) };
  });

  return (
    <Card className={MONITORING_CARD_CLASS}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description={emptyDescription} />
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
                  <Cell key={entry.id} fill={colorFor(entry.value, index)} />
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
