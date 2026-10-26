import { Link } from "react-router-dom";
import { Plus, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { formatDateShortId } from "@/lib/text";
import { getEvaluationDueLabel } from "@/lib/thesisLabels";
import { formatPhaseSessionSummary } from "@/components/thesis/ThesisPhaseFilter";
import type { MyThesisDetail } from "@/services/studentGuidance.service";

/** Completed sessions needed before the results seminar; the readiness status overrides it. */
const DEFAULT_REQUIRED_GUIDANCES = 8;

function percent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

function Meter({ label, done, total, unit }: { label: string; done: number; total: number; unit: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{done} dari {total} {unit}</p>
      </div>
      <Progress value={percent(done, total)} className="h-2" aria-label={label} />
    </div>
  );
}

export interface StudentThesisProgressCardProps {
  thesis: MyThesisDetail;
  /** From the seminar readiness status; falls back to 8. */
  requiredGuidances?: number;
  /** Why "Ajukan Bimbingan" is disabled; null when the student may ask. */
  guidanceBlockReason: string | null;
  /** A finished thesis: totals only, without activity, due evaluations or action buttons. */
  readOnly?: boolean;
}

/**
 * "Masa Bimbingan dan Progres": supervision time and activity level (derived when read),
 * the academic warning with the extension deadline, completed sessions out of the required
 * count, and milestone progress.
 */
export function StudentThesisProgressCard({ thesis, requiredGuidances, guidanceBlockReason, readOnly = false }: StudentThesisProgressCardProps) {
  const clock = thesis.supervisionClock ?? null;
  const completedGuidances = thesis.stats.completedGuidances ?? 0;
  const required = requiredGuidances ?? DEFAULT_REQUIRED_GUIDANCES;
  // The meters follow the current phase; proposal sessions have no minimum.
  const isProposalPhase = thesis.currentPhase === "proposal";
  const proposal = thesis.phases?.proposal;
  const phaseSummary = formatPhaseSessionSummary(thesis.phases);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Masa Bimbingan dan Progres</CardTitle>
        <CardDescription>
          {readOnly
            ? "Ringkasan masa bimbingan, sesi bimbingan, dan milestone tugas akhir ini."
            : "Dihitung dari tanggal mulai bimbingan dan aktivitas terakhir; tidak ada tenggat."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Masa bimbingan</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {clock?.elapsedLabel ?? "-"}
              {clock?.isPaused ? <span className="font-normal text-muted-foreground"> (berhenti selama cuti)</span> : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Mulai bimbingan</dt>
            <dd className="mt-0.5 text-sm font-medium">{clock?.startedAt ? formatDateShortId(clock.startedAt) : "-"}</dd>
          </div>
          {!readOnly && (
            <>
              <div>
                <dt className="text-xs text-muted-foreground">Aktivitas</dt>
                <dd className="mt-0.5"><ThesisActivityBadge level={thesis.activityLevel ?? null} /></dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Evaluasi bimbingan</dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {clock?.evaluationDue ? <Badge variant="warning">{getEvaluationDueLabel(clock.evaluationDue)}</Badge> : "Tidak ada yang jatuh tempo"}
                </dd>
              </div>
            </>
          )}
        </dl>

        {/* A running warning is the ribbon on top of the Overview, not repeated here. */}
        {isProposalPhase ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Sesi bimbingan proposal selesai</p>
              <p className="text-sm text-muted-foreground">{proposal?.guidances.completed ?? 0} sesi (tanpa jumlah minimum)</p>
            </div>
            <Meter label="Milestone proposal selesai" done={proposal?.milestones.completed ?? 0} total={proposal?.milestones.total ?? 0} unit="milestone" />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <Meter label="Sesi bimbingan selesai" done={completedGuidances} total={required} unit="sesi" />
            <Meter label="Milestone selesai" done={thesis.stats.completedMilestones} total={thesis.stats.totalMilestones} unit="milestone" />
          </div>
        )}
        {phaseSummary && <p className="text-xs text-muted-foreground">{phaseSummary}</p>}

        {!readOnly && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {guidanceBlockReason ? (
                <Button disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajukan Bimbingan
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/tugas-akhir/bimbingan/student?action=create">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajukan Bimbingan
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/tugas-akhir/bimbingan/student/milestone">
                  <Target className="mr-2 h-4 w-4" />
                  Kelola Milestone
                </Link>
              </Button>
            </div>
            {guidanceBlockReason && (
              <p className="text-xs text-muted-foreground">Ajukan Bimbingan belum tersedia: {guidanceBlockReason}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
