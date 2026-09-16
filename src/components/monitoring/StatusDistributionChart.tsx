import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import type { StatusDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";
import { getThesisStatusStyle } from "@/lib/monitoring/thesisStatus";

interface StatusDistributionChartProps {
  statusDistribution: StatusDistribution[] | undefined;
  isLoading: boolean;
}

function getColor(status: string): string {
  return getThesisStatusStyle(status).chartColor;
}

export function StatusDistributionChart({ statusDistribution, isLoading }: StatusDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi Status Tugas Akhir</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = (statusDistribution ?? []).filter(s => s.count > 0);
  const total = data.reduce((sum, s) => sum + s.count, 0);

  const chartConfig: ChartConfig = {};
  data.forEach((s) => {
    chartConfig[s.name] = { label: s.name, color: getColor(s.name) };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi Status Tugas Akhir</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada data status" />
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
                {data.map((entry) => (
                  <Cell key={entry.id} fill={getColor(entry.name)} />
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
