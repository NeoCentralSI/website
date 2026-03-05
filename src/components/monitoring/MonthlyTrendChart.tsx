import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { GuidanceTrend } from "@/services/monitoring.service";
import EmptyState from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/spinner";

interface GuidanceTrendChartProps {
  guidanceTrend: GuidanceTrend[] | undefined;
  isLoading: boolean;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu",
  "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
};

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[m] || m} ${year.slice(2)}`;
}

export function GuidanceTrendChart({ guidanceTrend, isLoading }: GuidanceTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Jadwal Bimbingan</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-62.5">
          <Loading size="md" text="Memuat..." />
        </CardContent>
      </Card>
    );
  }

  const data = guidanceTrend ?? [];
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const chartConfig: ChartConfig = {
    count: { label: "Sesi Bimbingan", color: "#6366f1" },
  };

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tren Jadwal Bimbingan</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Belum ada data jadwal bimbingan" />
        ) : (
          <ChartContainer config={chartConfig} className="h-62.5 w-full">
            <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={11} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span>{value} sesi bimbingan</span>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
