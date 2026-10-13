import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { toTitleCaseName, formatLecturerName } from "@/lib/text";
import { getEvaluationDueLabel } from "@/lib/thesisLabels";
import type { EvaluationDueStudent } from "@/services/monitoring.service";
import { MonitoringListCard, MonitoringListRow } from "./MonitoringListCard";

interface EvaluationDueCardProps {
  students: EvaluationDueStudent[] | undefined;
  isLoading: boolean;
}

/**
 * "Perlu Evaluasi": running theses whose guidance evaluation (six months, extension
 * follow-up, or one year) is due. What is due is derived when read; there is no cron.
 */
export function EvaluationDueCard({ students, isLoading }: EvaluationDueCardProps) {
  const navigate = useNavigate();
  const rows = students ?? [];

  return (
    <MonitoringListCard
      icon={ClipboardCheck}
      iconClassName="text-amber-600"
      title="Perlu Evaluasi"
      description="Tugas akhir yang evaluasi bimbingannya jatuh tempo dan belum diisi Pembimbing 1"
      count={rows.length}
      isLoading={isLoading}
      emptyDescription="Tidak ada evaluasi bimbingan yang jatuh tempo."
    >
      {rows.map((row) => (
        <MonitoringListRow
          key={row.thesisId}
          name={toTitleCaseName(row.student.name)}
          identityNumber={row.student.nim}
          secondary={
            <>
              Masa bimbingan {row.supervisionClock.elapsedLabel}
              {row.supervisors[0]?.name ? ` · ${formatLecturerName(row.supervisors[0].name)}` : ""}
            </>
          }
          trailing={
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-end gap-1">
                <Badge variant="warning" className="whitespace-nowrap text-[11px]">{getEvaluationDueLabel(row.evaluationDue)}</Badge>
                <ThesisActivityBadge level={row.activityLevel} className="text-[11px]" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Lihat detail ${toTitleCaseName(row.student.name)}`}
                onClick={() => navigate(`/tugas-akhir/monitoring/${row.thesisId}`)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      ))}
    </MonitoringListCard>
  );
}
