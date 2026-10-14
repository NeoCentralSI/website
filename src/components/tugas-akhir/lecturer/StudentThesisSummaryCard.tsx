import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";

import { SupervisionClockCell } from "@/components/shared/SupervisionClockCell";
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateShortId, formatLecturerName } from "@/lib/text";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

/** Completed sessions needed before the results seminar; the readiness status overrides it. */
const DEFAULT_REQUIRED_GUIDANCES = 8;

function percent(done: number, total: number) {
    return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-1 text-sm font-medium">{children}</div>
        </div>
    );
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

export interface SummarySupervisor {
    name: string | null;
    /** Already a display label, e.g. "Pembimbing 1". */
    roleLabel: string;
}

interface StudentThesisSummaryCardProps {
    detail: StudentDetail;
    topicName: string | null | undefined;
    supervisors: SummarySupervisor[];
    /** From the seminar readiness status; falls back to the sessions in the history and 8. */
    guidanceProgress?: { completed: number; required: number } | null;
}

/**
 * Compact "Informasi Tugas Akhir" at the top of the Progres tab: title, topic, supervisors,
 * supervision time, activity, completed sessions out of the required count and milestones.
 */
export function StudentThesisSummaryCard({ detail, topicName, supervisors, guidanceProgress }: StudentThesisSummaryCardProps) {
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
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Informasi Tugas Akhir
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <p className="text-base font-semibold leading-snug [overflow-wrap:anywhere]">
                            {detail.title || <span className="font-normal italic text-muted-foreground">Judul belum ditentukan</span>}
                        </p>
                        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                            <Fact label="Topik">
                                {topicName ? <Badge variant="outline" className="max-w-full"><span className="truncate" title={topicName}>{topicName}</span></Badge> : "-"}
                            </Fact>
                            <Fact label="Mulai">{detail.startDate ? formatDateShortId(detail.startDate) : "-"}</Fact>
                            <Fact label="Pembimbing">
                                {supervisors.length === 0 ? "-" : (
                                    <ul className="space-y-1">
                                        {supervisors.map((supervisor) => (
                                            <li key={`${supervisor.roleLabel}-${supervisor.name}`} className="flex flex-wrap items-baseline gap-x-2">
                                                <span className="[overflow-wrap:anywhere]">{formatLecturerName(supervisor.name) || "-"}</span>
                                                <span className="text-xs font-normal text-muted-foreground">{supervisor.roleLabel}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Fact>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Fact label="Masa Bimbingan"><SupervisionClockCell clock={detail.supervisionClock} wrap /></Fact>
                                <Fact label="Aktivitas"><ThesisActivityBadge level={detail.activityLevel} /></Fact>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 lg:border-l lg:pl-6">
                        {phase === "proposal" ? (
                            <Fact label="Bimbingan proposal">{completedGuidances} sesi selesai (tanpa jumlah minimum)</Fact>
                        ) : (
                            <Meter label="Progres bimbingan" done={completedGuidances} total={requiredGuidances} unit="sesi" />
                        )}
                        <Meter
                            label={phase === "proposal" ? "Progres milestone proposal" : "Progres milestone"}
                            done={completedMilestones}
                            total={phaseMilestones.length}
                            unit="milestone"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
