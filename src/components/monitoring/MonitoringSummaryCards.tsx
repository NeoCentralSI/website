import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  AlertTriangle, 
  GraduationCap,
  TrendingUp 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgressStats } from "@/services/monitoring.service";

interface MonitoringSummaryCardsProps {
  summary: ProgressStats | undefined;
  isLoading: boolean;
}

export function MonitoringSummaryCards({ summary, isLoading }: MonitoringSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Mahasiswa Aktif",
      value: summary?.totalActiveTheses ?? 0,
      description: "Mahasiswa dengan tugas akhir aktif",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Rata-rata Progress",
      value: `${summary?.averageProgress ?? 0}%`,
      description: `${summary?.studentsComplete100 ?? 0} mahasiswa 100%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Siap Seminar",
      value: summary?.totalReadyForSeminar ?? 0,
      description: "Menunggu jadwal seminar",
      icon: GraduationCap,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Mahasiswa Berisiko",
      value: summary?.totalAtRisk ?? 0,
      description: "Tidak ada aktivitas > 2 bulan",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
