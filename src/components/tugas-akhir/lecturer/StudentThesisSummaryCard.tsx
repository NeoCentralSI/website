import type { ReactNode } from "react";

import { SupervisionClockCell } from "@/components/shared/SupervisionClockCell";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

/** Completed sessions needed before the results seminar; the readiness status overrides it. */
const DEFAULT_REQUIRED_GUIDANCES = 8;

function percent(done: number, total: number) {
    return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

/** One small summary card of the row. */
function Tile({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <Card className={cn("min-w-0 gap-0 p-3", className)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-1 min-w-0 text-sm font-medium">{children}</div>
        </Card>
    );
}

function Meter({ label, done, total, unit }: { label: string; done: number; total: number; unit: string }) {
    return (
        <Tile label={label}>
            <p>{done} dari {total} {unit}</p>
            <Progress value={percent(done, total)} className="mt-2 h-1.5" aria-label={label} />
        </Tile>
    );
}

interface StudentThesisSummaryCardProps {
    detail: StudentDetail;
    topicName: string | null | undefined;
    /** From the seminar readiness status; falls back to the sessions in the history and 8. */
    guidanceProgress?: { completed: number; required: number } | null;
}

/**
 * Compact "Informasi Tugas Akhir" (Paket E4, 5): one row of small cards with the title, topic,
 * supervision time, activity, completed sessions out of the required count and milestones.
 * The supervisors are in the page header.
 */
export function StudentThesisSummaryCard({ detail, topicName, guidanceProgress }: StudentThesisSummaryCardProps) {
    // 10.7: the meters follow the current phase; proposal sessions have no minimum (K27).
    const phase = detail.currentPhase ?? "research";
    const phaseMilestones = detail.milestones.filter((milestone) => (milestone.phase ?? "research") === phase);
    const completedMilestones = phaseMilestones.filter((milestone) => milestone.status === "completed").length;
    const completedGuidances = phase === "research"
        ? guidanceProgress?.completed
            ?? detail.guidanceHistory.items.filter((guidance) => guidance.status === "completed" && (guidance.phase ?? "research") === "research").length
        : detail.phases?.proposal.guidances.completed
            ?? detail.guidanceHistory.items.filter((guidance) => guidance.status === "completed" && guidance.phase === "proposal").length;
    const requiredGuidances = guidanceProgress?.required ?? DEFAULT_REQUIRED_GUIDANCES;

    return (
        <section aria-label="Informasi Tugas Akhir" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            <Tile label="Judul" className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
                {detail.title ? (
                    <p className="line-clamp-3 leading-snug [overflow-wrap:anywhere]" title={detail.title}>{detail.title}</p>
                ) : (
                    <span className="font-normal italic text-muted-foreground">Judul belum ditentukan</span>
                )}
            </Tile>
            <Tile label="Topik">
                {topicName ? <Badge variant="outline" className="max-w-full"><span className="truncate" title={topicName}>{topicName}</span></Badge> : "-"}
            </Tile>
            <Tile label="Masa Bimbingan"><SupervisionClockCell clock={detail.supervisionClock} wrap /></Tile>
            <Tile label="Aktivitas"><ThesisActivityBadge level={detail.activityLevel} /></Tile>
            {phase === "proposal" ? (
                <Tile label="Bimbingan proposal">{completedGuidances} sesi selesai (tanpa jumlah minimum)</Tile>
            ) : (
                <Meter label="Progres bimbingan" done={completedGuidances} total={requiredGuidances} unit="sesi" />
            )}
            <Meter
                label={phase === "proposal" ? "Progres milestone proposal" : "Progres milestone"}
                done={completedMilestones}
                total={phaseMilestones.length}
                unit="milestone"
            />
        </section>
    );
}
