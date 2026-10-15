import { AlertCircle, CalendarClock, CheckCircle2, FileClock, Hourglass, Sigma, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ThesisEventKind, ThesisEventSummary } from "@/services/monitoring.service";
import { MONITORING_CARD_CLASS } from "./MonitoringListCard";

const scoreFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

interface SummaryCard {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface ThesisEventSummaryCardsProps {
  kind: ThesisEventKind;
  summary: ThesisEventSummary | undefined;
  isLoading: boolean;
}

/** Summary row of the Seminar Hasil and Sidang tabs; Sidang adds the average final score. */
export function ThesisEventSummaryCards({ kind, summary, isLoading }: ThesisEventSummaryCardsProps) {
  const cards: SummaryCard[] = [
    {
      title: "Dalam Proses",
      value: summary?.inProcess ?? 0,
      description: "Mendaftar sampai menunggu jadwal",
      icon: Hourglass,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Terjadwal",
      value: summary?.scheduled ?? 0,
      description: "Sudah punya jadwal pelaksanaan",
      icon: CalendarClock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Lulus",
      value: summary?.passed ?? 0,
      description: "Termasuk lulus dengan revisi",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Revisi Belum Final",
      value: summary?.revisionPending ?? 0,
      description: "Lulus dengan revisi, belum difinalkan",
      icon: FileClock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Tidak Lulus / Dibatalkan",
      value: summary?.notPassed ?? 0,
      description: "Tidak lulus atau pendaftaran batal",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];
  if (kind === "defence") {
    cards.push({
      title: "Rata-rata Nilai Akhir",
      value: summary?.averageFinalScore != null ? scoreFormat.format(summary.averageFinalScore) : "-",
      description: "Dari sidang yang sudah lulus",
      icon: Sigma,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    });
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", kind === "defence" ? "xl:grid-cols-6" : "xl:grid-cols-5")}>
      {cards.map((card) => (
        <Card key={card.title} className={MONITORING_CARD_CLASS}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={cn("shrink-0 rounded-full p-2", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid={`summary-${card.title}`}>{card.value}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
