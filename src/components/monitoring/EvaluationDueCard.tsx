import { useNavigate } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { toTitleCaseName } from "@/lib/text";
import { getEvaluationDueLabel } from "@/lib/thesisLabels";
import type { EvaluationDueStudent } from "@/services/monitoring.service";

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-amber-600" />
          Perlu Evaluasi
          {!isLoading && <Badge variant="secondary">{rows.length}</Badge>}
        </CardTitle>
        <CardDescription>Tugas akhir yang evaluasi bimbingannya jatuh tempo dan belum diisi Pembimbing 1</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState size="sm" title="Tidak Ada Data" description="Tidak ada evaluasi bimbingan yang jatuh tempo." className="py-6" />
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {rows.map((row) => (
              <li key={row.thesisId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-2 text-left hover:bg-muted/50"
                  onClick={() => navigate(`/tugas-akhir/monitoring/${row.thesisId}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={row.student.name}>
                      {toTitleCaseName(row.student.name)} <span className="font-normal text-muted-foreground">· {row.student.nim}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Masa bimbingan {row.supervisionClock.elapsedLabel}
                      {row.supervisors[0]?.name ? ` · ${toTitleCaseName(row.supervisors[0].name)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="warning" className="whitespace-nowrap text-[11px]">{getEvaluationDueLabel(row.evaluationDue)}</Badge>
                    <ThesisActivityBadge level={row.activityLevel} className="text-[11px]" />
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
