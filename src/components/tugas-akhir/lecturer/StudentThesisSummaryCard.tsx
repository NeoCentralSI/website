import type { ReactNode } from "react";

import { SupervisionClockCell } from "@/components/shared/SupervisionClockCell";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatLecturerName } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

/** Completed sessions needed before the results seminar; the readiness status overrides it. */
const DEFAULT_REQUIRED_GUIDANCES = 8;

export interface SummarySupervisor {
    name: string | null;
    /** Already a display label, e.g. "Pembimbing 1". */
    roleLabel: string;
}

function percent(done: number, total: number) {
    return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

/** One labelled value of the card's grid. */
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div className={cn("min-w-0", className)}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 min-w-0 text-sm font-medium">{children}</dd>
        </div>
    );
}

function Meter({ label, done, total, unit }: { label: string; done: number; total: number; unit: string }) {
    return (
        <Field label={label}>
            <p>{done} dari {total} {unit}</p>
            <Progress value={percent(done, total)} className="mt-2 h-1.5" aria-label={label} />
        </Field>
    );
}

interface StudentThesisSummaryCardProps {
    detail: StudentDetail;
    topicName: string | null | undefined;
    /** Pembimbing 1 and 2, read by the page from the change context (positions). */
    supervisors: SummarySupervisor[];
    /** From the seminar readiness status; falls back to the sessions in the history and 8. */
    guidanceProgress?: { completed: number; required: number } | null;
}

/**
 * "Informasi Tugas Akhir": one card with a grid of two to three columns, the
 * title on the full first row, then topic, Pembimbing 1 and 2, supervision time with the due
 * marker, activity, and the progress of guidance (n of 8) and milestones (n of m).
 */
export function StudentThesisSummaryCard({ detail, topicName, supervisors, guidanceProgress }: StudentThesisSummaryCardProps) {
    // The meters follow the current phase; proposal sessions have no minimum.
    const phase = detail.currentPhase ?? "research";
    const phaseMilestones = detail.milestones.filter((milestone) => (milestone.phase ?? "research") === phase);
    const completedMilestones = phaseMilestones.filter((milestone) => milestone.status === "completed").length;
    const completedGuidances = phase === "research"
        ? guidanceProgress?.completed
            ?? detail.guidanceHistory.items.filter((guidance) => guidance.status === "completed" && (guidance.phase ?? "research") === "research").length
        : detail.phases?.proposal.guidances.completed
            ?? detail.guidanceHistory.items.filter((guidance) => guidance.status === "completed" && guidance.phase === "proposal").length;
    const requiredGuidances = guidanceProgress?.required ?? DEFAULT_REQUIRED_GUIDANCES;
    const supervisorName = (roleLabel: string) =>
        formatLecturerName(supervisors.find((supervisor) => supervisor.roleLabel === roleLabel)?.name) || "-";

    return (
        <section aria-label="Informasi Tugas Akhir">
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-base">Informasi Tugas Akhir</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Judul" className="col-span-full">
                            {detail.title ? (
                                <p className="line-clamp-2 leading-snug [overflow-wrap:anywhere]" title={detail.title}>{detail.title}</p>
                            ) : (
                                <span className="font-normal italic text-muted-foreground">Judul belum ditentukan</span>
                            )}
                        </Field>
                        <Field label="Topik">
                            {topicName ? (
                                <Badge variant="outline" className="inline-block max-w-full truncate align-top" title={topicName}>{topicName}</Badge>
                            ) : "-"}
                        </Field>
                        <Field label="Pembimbing 1"><p className="truncate" title={supervisorName("Pembimbing 1")}>{supervisorName("Pembimbing 1")}</p></Field>
                        <Field label="Pembimbing 2"><p className="truncate" title={supervisorName("Pembimbing 2")}>{supervisorName("Pembimbing 2")}</p></Field>
                        <Field label="Masa Bimbingan"><SupervisionClockCell clock={detail.supervisionClock} wrap /></Field>
                        <Field label="Aktivitas"><ThesisActivityBadge level={detail.activityLevel} /></Field>
                        {phase === "proposal" ? (
                            <Field label="Bimbingan proposal">{completedGuidances} sesi selesai (tanpa jumlah minimum)</Field>
                        ) : (
                            <Meter label="Progres bimbingan" done={completedGuidances} total={requiredGuidances} unit="sesi" />
                        )}
                        <Meter
                            label={phase === "proposal" ? "Progres milestone proposal" : "Progres milestone"}
                            done={completedMilestones}
                            total={phaseMilestones.length}
                            unit="milestone"
                        />
                    </dl>
                </CardContent>
            </Card>
        </section>
    );
}
