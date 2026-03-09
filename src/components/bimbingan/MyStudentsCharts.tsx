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

  // Compute guidance distribution
  const guidanceData = useMemo(() => {
    // Count students per guidance count bucket
    // Buckets: 0, 1-3, 4-7, 8-11, 12-15, 16+
    const buckets = [
      { label: "0", min: 0, max: 0, count: 0, color: "#ef4444" },
      { label: "1-3", min: 1, max: 3, count: 0, color: "#f97316" },
      { label: "4-7", min: 4, max: 7, count: 0, color: "#eab308" },
      { label: "8-11", min: 8, max: 11, count: 0, color: "#22c55e" },
      { label: "12-15", min: 12, max: 15, count: 0, color: "#3b82f6" },
      { label: "16+", min: 16, max: 999, count: 0, color: "#8b5cf6" },
    ];

    students.forEach((s) => {
      const count = s.completedGuidanceCount || 0;
      const bucket = buckets.find((b) => count >= b.min && count <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
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

  const ratingConfig: ChartConfig = {};
  ratingData.forEach((r) => {
    ratingConfig[r.name] = { label: r.name, color: RATING_COLORS[r.value] || "#64748b" };
  });

  const guidanceConfig: ChartConfig = {
    count: { label: "Mahasiswa", color: "#3b82f6" },
  };

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

      {/* Guidance Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Jumlah Bimbingan</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={guidanceConfig} className="h-50 w-full">
            <BarChart data={guidanceData} margin={{ left: 0, right: 8, top: 8 }}>
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
                {guidanceData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
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
