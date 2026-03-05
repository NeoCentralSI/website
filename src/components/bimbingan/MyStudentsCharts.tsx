import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";

interface MyStudentsChartsProps {
  students: MyStudentItem[];
}

const RATING_COLORS: Record<string, string> = {
  ONGOING: "#22c55e",
  SLOW: "#eab308",
  AT_RISK: "#f97316",
  FAILED: "#ef4444",
  CANCELLED: "#64748b",
};

const RATING_LABELS: Record<string, string> = {
  ONGOING: "Ongoing",
  SLOW: "Slow",
  AT_RISK: "At Risk",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

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

const PROGRESS_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function MyStudentsCharts({ students }: MyStudentsChartsProps) {
  // Compute rating distribution
  const ratingData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const rating = s.thesisRating || "ONGOING";
      counts[rating] = (counts[rating] || 0) + 1;
    });
    return Object.entries(counts).map(([key, count]) => ({
      id: key,
      name: RATING_LABELS[key] || key,
      value: key,
      count,
    }));
  }, [students]);

  // Compute status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const status = s.thesisStatus || "Bimbingan";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  // Compute progress distribution
  const progressData = useMemo(() => {
    const buckets = [
      { label: "0%", min: 0, max: 0, count: 0 },
      { label: "1-25%", min: 1, max: 25, count: 0 },
      { label: "26-50%", min: 26, max: 50, count: 0 },
      { label: "51-75%", min: 51, max: 75, count: 0 },
      { label: "76-99%", min: 76, max: 99, count: 0 },
      { label: "100%", min: 100, max: 100, count: 0 },
    ];
    students.forEach((s) => {
      const progress = s.milestoneProgress || 0;
      const bucket = buckets.find((b) => progress >= b.min && progress <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [students]);

  if (students.length === 0) return null;

  const ratingTotal = ratingData.reduce((sum, r) => sum + r.count, 0);
  const statusTotal = statusData.reduce((sum, s) => sum + s.count, 0);

  const ratingConfig: ChartConfig = {};
  ratingData.forEach((r) => {
    ratingConfig[r.name] = { label: r.name, color: RATING_COLORS[r.value] || "#64748b" };
  });

  const statusConfig: ChartConfig = {};
  statusData.forEach((s, i) => {
    statusConfig[s.name] = { label: s.name, color: STATUS_COLORS[s.name] || `hsl(${i * 45}, 70%, 50%)` };
  });

  const progressConfig: ChartConfig = {
    count: { label: "Mahasiswa", color: "#3b82f6" },
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Rating Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Rating Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={ratingConfig} className="h-50 w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>{name}: {value} ({ratingTotal > 0 ? Math.round((Number(value) / ratingTotal) * 100) : 0}%)</span>
                    )}
                  />
                }
              />
              <Pie
                data={ratingData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}
              >
                {ratingData.map((entry) => (
                  <Cell key={entry.id} fill={RATING_COLORS[entry.value] || "#64748b"} />
                ))}
              </Pie>
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Status Tugas Akhir</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="h-50 w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>{name}: {value} ({statusTotal > 0 ? Math.round((Number(value) / statusTotal) * 100) : 0}%)</span>
                    )}
                  />
                }
              />
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}
              >
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || `hsl(${i * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Progress Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Progress Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={progressConfig} className="h-50 w-full">
            <BarChart data={progressData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={10} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => <span>{value} mahasiswa</span>}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                {progressData.map((_, index) => (
                  <Cell key={index} fill={PROGRESS_COLORS[index % PROGRESS_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
