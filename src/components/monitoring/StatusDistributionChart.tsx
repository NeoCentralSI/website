import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend } from "recharts";
import type { StatusDistribution } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";

interface StatusDistributionChartProps {
  statusDistribution: StatusDistribution[] | undefined;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  "Bimbingan": "#3b82f6",
  "Acc Seminar": "#f59e0b",
  "Seminar Proposal": "#8b5cf6",
  "Revisi Proposal": "#f97316",
  "Penelitian": "#06b6d4",
  "Seminar Hasil": "#6366f1",
  "Sidang": "#ec4899",
  "Revisi Akhir": "#f43f5e",
  "Selesai": "#22c55e",
  "Gagal": "#ef4444",
};

function getColor(status: string, index: number): string {
  return STATUS_COLORS[status] || `hsl(${index * 45}, 70%, 50%)`;
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
  data.forEach((s, i) => {
    chartConfig[s.name] = { label: s.name, color: getColor(s.name, i) };
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
                {data.map((entry, index) => (
                  <Cell key={entry.id} fill={getColor(entry.name, index)} />
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
