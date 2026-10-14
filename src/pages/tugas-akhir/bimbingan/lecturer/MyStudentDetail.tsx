import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, PartyPopper } from "lucide-react";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { DefenceReadinessCard } from "@/components/milestone/lecturer/DefenceReadinessCard";
import { SeminarReadinessCard } from "@/components/milestone/lecturer/SeminarReadinessCard";
import { LecturerThesisChangeRequestCard } from "@/components/thesis-change-request/LecturerThesisChangeRequestCard";
import { LecturerThesisGuidanceEvaluationCard } from "@/components/thesis-guidance-evaluation/LecturerThesisGuidanceEvaluationCard";
import { ThesisActionBlockedAlert } from "@/components/thesis/ThesisActionBlockedAlert";
import { ThesisPhaseFilter, formatPhaseSessionSummary, type PhaseFilterValue } from "@/components/thesis/ThesisPhaseFilter";
import { OtherPhaseMilestones } from "@/components/milestone/OtherPhaseMilestones";
import { GuidanceHistorySection } from "@/components/tugas-akhir/lecturer/GuidanceHistorySection";
import { StudentDetailHeader } from "@/components/tugas-akhir/lecturer/StudentDetailHeader";
import { StudentDocumentsCard } from "@/components/tugas-akhir/lecturer/StudentDocumentsCard";
import { StudentMilestoneCard } from "@/components/tugas-akhir/lecturer/StudentMilestoneCard";
import { StudentThesisSummaryCard, type SummarySupervisor } from "@/components/tugas-akhir/lecturer/StudentThesisSummaryCard";
import { getStudentDetailPendingCounts } from "@/components/tugas-akhir/lecturer/studentDetailPending";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { LocalTabsNav } from "@/components/ui/tabs-nav";
import { useDefenceReadinessStatus, useSeminarReadinessStatus } from "@/hooks/milestone/useMilestone";
import { useThesisChangeContext } from "@/hooks/thesis-change-request/useThesisChangeRequest";
import { useEvaluationContext } from "@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation";
import { formatRoleName, toTitleCaseName } from "@/lib/text";
import { getGuidanceActionBlockReason, getSupervisorPositionLabel, getThesisStatusLabel } from "@/lib/thesisLabels";
import { cn } from "@/lib/utils";
import { getStudentDetail } from "@/services/lecturerGuidance.service";

const MY_STUDENTS_PATH = "/tugas-akhir/bimbingan/lecturer/my-students";

type DetailTab = "progres" | "kesiapan" | "evaluasi";
const DETAIL_TABS: DetailTab[] = ["progres", "kesiapan", "evaluasi"];
const DEFAULT_TAB: DetailTab = "progres";

/**
 * Bimbingan > Mahasiswa > detail (supervisor). A header that is always visible and three
 * tabs kept in `?tab=`: Progres (default), Kesiapan Seminar & Sidang, Evaluasi & Perubahan.
 * A tab carries a number when something on it waits for the signed-in supervisor.
 */
export default function LecturerMyStudentDetailPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { thesisId } = useParams<{ thesisId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const requestedTab = searchParams.get("tab") as DetailTab | null;
    const activeTab = requestedTab && DETAIL_TABS.includes(requestedTab) ? requestedTab : DEFAULT_TAB;
    const setActiveTab = (tab: string) => {
        setSearchParams(tab === DEFAULT_TAB ? {} : { tab }, { replace: true });
    };

    // Initial breadcrumb, will be updated when data is loaded
    const baseBreadcrumb = useMemo(() => [
        { label: "Tugas Akhir" },
        { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" },
        { label: "Mahasiswa Bimbingan", href: MY_STUDENTS_PATH },
        { label: "Detail Mahasiswa" }
    ], []);

    useEffect(() => {
        setBreadcrumbs(baseBreadcrumb);
        setTitle("Detail Mahasiswa Bimbingan");
    }, [baseBreadcrumb, setBreadcrumbs, setTitle]);

    const { data: detailData, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['student-detail', thesisId],
        queryFn: () => getStudentDetail(thesisId!).then(res => res.data),
        enabled: !!thesisId
    });

    // The cards below read the same queries; here they feed the summary and the tab markers.
    const { data: readinessStatus } = useSeminarReadinessStatus(thesisId);
    const { data: defenceStatus } = useDefenceReadinessStatus(thesisId);
    const { data: changeContext } = useThesisChangeContext(thesisId, !!thesisId);
    const { data: evaluationContext } = useEvaluationContext(thesisId, !!thesisId);
    const isSeminarCompleted = defenceStatus?.requirementsMet === true;

    // 10.7: milestones of the current phase are worked on; the other phase is read-only below.
    const currentPhase = detailData?.currentPhase ?? "research";
    const otherPhase = currentPhase === "proposal" ? "research" : "proposal";
    const phaseMilestones = useMemo(
        () => (detailData?.milestones ?? []).filter((m) => (m.phase ?? "research") === currentPhase),
        [detailData?.milestones, currentPhase],
    );
    const otherPhaseMilestones = useMemo(
        () => (detailData?.milestones ?? []).filter((m) => (m.phase ?? "research") === otherPhase),
        [detailData?.milestones, otherPhase],
    );
    // Guidance history: the current phase by default; Semua · Proposal · Penelitian.
    const [phaseFilter, setPhaseFilter] = useState<PhaseFilterValue | null>(null);
    const shownPhase = phaseFilter ?? currentPhase;
    const guidanceHistory = useMemo(() => {
        if (!detailData?.guidanceHistory) return null;
        const items = shownPhase
            ? detailData.guidanceHistory.items.filter((g) => (g.phase ?? "research") === shownPhase)
            : detailData.guidanceHistory.items;
        return { count: items.length, items };
    }, [detailData?.guidanceHistory, shownPhase]);

    const progressPercentage = useMemo(() => {
        if (!phaseMilestones.length) return 0;
        const completed = phaseMilestones.filter(m => m.status === 'completed').length;
        return Math.round((completed / phaseMilestones.length) * 100);
    }, [phaseMilestones]);

    // Ended thesis (K15): read-only history.
    const isCancelled = detailData?.status === "failed" || detailData?.status === "completed";
    // K14/K27: milestone/guidance writes for `research`, or `proposal` after Penetapan Pembimbing.
    const actionBlockReason = detailData
        ? getGuidanceActionBlockReason(detailData.status, "mahasiswa", {
            repeatingProposal: detailData.repeatingProposal,
            proposalPhaseOpen: detailData.proposalPhaseOpen,
        })
        : null;

    const isPembimbing1 = useMemo(() => {
        if (!detailData?.userRole) return false;
        const role = detailData.userRole.toLowerCase();
        return role === "pembimbing 1" || role === "pembimbing1";
    }, [detailData?.userRole]);

    // Update breadcrumb with student name when data is loaded
    useEffect(() => {
        if (detailData?.student.fullName) {
            setBreadcrumbs([
                { label: "Tugas Akhir" },
                { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" },
                { label: "Mahasiswa Bimbingan", href: MY_STUDENTS_PATH },
                { label: toTitleCaseName(detailData.student.fullName) }
            ]);
        }
    }, [detailData, setBreadcrumbs]);

    // Supervisors for the summary: the change context knows the positions; the readiness
    // status is the fallback while it loads or when it has no thesis.
    const supervisors = useMemo<SummarySupervisor[]>(() => {
        const fromContext = changeContext?.thesis?.supervisors ?? [];
        if (fromContext.length > 0) {
            return fromContext.map((supervisor) => ({
                name: supervisor.name,
                roleLabel: supervisor.position ? getSupervisorPositionLabel(supervisor.position) : "Pembimbing",
            }));
        }
        return (readinessStatus?.supervisors ?? defenceStatus?.supervisors ?? []).map((supervisor) => ({
            name: supervisor.name,
            roleLabel: formatRoleName(supervisor.role),
        }));
    }, [changeContext?.thesis?.supervisors, readinessStatus?.supervisors, defenceStatus?.supervisors]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Memuat detail mahasiswa...</p>
            </div>
        );
    }

    if (isError || !detailData || !thesisId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100">
                <EmptyState
                    title="Terjadi Kesalahan"
                    description="Gagal memuat data mahasiswa. Silakan coba lagi."
                    showButton
                    buttonText="Kembali"
                    onButtonClick={() => window.location.href = MY_STUDENTS_PATH}
                />
            </div>
        );
    }

    // Seminar readiness is hidden once the student has passed the seminar; both cards are
    // for a thesis in status Penelitian only.
    const showSeminarCard = !isSeminarCompleted && detailData.status === "research";
    const showDefenceCard = detailData.status === "research";
    const sideBySide = showSeminarCard && showDefenceCard;

    const pending = getStudentDetailPendingCounts({
        milestones: phaseMilestones,
        isPembimbing1,
        isEnded: isCancelled,
        seminarReadiness: showSeminarCard ? readinessStatus : null,
        defenceReadiness: showDefenceCard ? defenceStatus : null,
        evaluationContext,
        changeContext,
    });

    const guidanceComplete = readinessStatus?.guidanceProgress?.isComplete;

    return (
        <div className="p-6 space-y-6">
            <StudentDetailHeader
                student={detailData.student}
                status={detailData.status}
                onRefresh={() => void refetch()}
                isRefreshing={isFetching && !isLoading}
            />

            {/* Cancelled/Failed Banner */}
            {isCancelled && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-800">Tugas Akhir Berakhir</AlertTitle>
                    <AlertDescription className="text-red-700">
                        Tugas akhir ini telah berstatus <strong>{getThesisStatusLabel(detailData.status)}</strong>.
                        Anda hanya dapat melihat riwayat dan tidak dapat melakukan perubahan data.
                    </AlertDescription>
                </Alert>
            )}

            {!isCancelled && <ThesisActionBlockedAlert reason={actionBlockReason} />}

            <div>
                <LocalTabsNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={[
                        { label: "Progres", value: "progres", badge: pending.progress },
                        { label: "Kesiapan Seminar & Sidang", value: "kesiapan", badge: pending.readiness },
                        { label: "Evaluasi & Perubahan", value: "evaluasi", badge: pending.evaluation },
                    ]}
                />

                {activeTab === "progres" && (
                    <div className="space-y-6">
                        {/* Alert Banner ketika milestone 100% (fase penelitian, syarat seminar) */}
                        {!isSeminarCompleted && currentPhase === "research" && progressPercentage === 100 && (
                            <Alert className={guidanceComplete ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                                {guidanceComplete ? (
                                    <PartyPopper className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                )}
                                <AlertTitle className={guidanceComplete ? "text-green-800" : "text-yellow-800"}>
                                    {guidanceComplete ? "Milestone Selesai 100%!" : "Milestone Selesai, Menunggu Bimbingan"}
                                </AlertTitle>
                                <AlertDescription className={guidanceComplete ? "text-green-700" : "text-yellow-700"}>
                                    {guidanceComplete
                                        ? "Mahasiswa ini telah menyelesaikan keseluruhan milestone dan syarat bimbingan. Silakan review kembali progress dan berikan approval agar mahasiswa dapat mendaftar seminar."
                                        : "Mahasiswa telah menyelesaikan milestone, namun syarat minimal 8 sesi bimbingan belum terpenuhi. Approval seminar dapat diberikan setelah syarat bimbingan tercapai."}
                                </AlertDescription>
                            </Alert>
                        )}

                        <StudentThesisSummaryCard
                            detail={detailData}
                            topicName={changeContext?.thesis?.topic?.name}
                            supervisors={supervisors}
                            guidanceProgress={readinessStatus?.guidanceProgress}
                        />

                        <ThesisPhaseFilter
                            value={shownPhase}
                            onChange={setPhaseFilter}
                            summary={formatPhaseSessionSummary(detailData.phases)}
                        />

                        {/* Milestone on the left so that a review is one glance away */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <StudentMilestoneCard
                                    thesisId={thesisId}
                                    milestones={phaseMilestones}
                                    isPembimbing1={isPembimbing1}
                                    isEnded={isCancelled}
                                    actionBlockReason={actionBlockReason}
                                />
                                <OtherPhaseMilestones
                                    phase={otherPhase}
                                    milestones={otherPhaseMilestones}
                                    reason={otherPhase === "proposal" ? "Fase proposal sudah selesai" : null}
                                />
                            </div>
                            {guidanceHistory && (
                                <GuidanceHistorySection guidanceHistory={guidanceHistory} />
                            )}
                        </div>

                        <StudentDocumentsCard detail={detailData} />
                    </div>
                )}

                {activeTab === "kesiapan" && (
                    showSeminarCard || showDefenceCard ? (
                        <div className={cn("grid grid-cols-1 items-start gap-6", sideBySide && "lg:grid-cols-2")}>
                            {showSeminarCard && (
                                <SeminarReadinessCard thesisId={thesisId} studentName={detailData.student.fullName} stacked={sideBySide} />
                            )}
                            {/* Defence readiness: same card shape; unmet requirements are listed, not hidden */}
                            {showDefenceCard && (
                                <DefenceReadinessCard thesisId={thesisId} studentName={detailData.student.fullName} stacked={sideBySide} />
                            )}
                        </div>
                    ) : (
                        <EmptyState
                            size="sm"
                            title="Tidak Ada Kesiapan untuk Ditinjau"
                            description="Kesiapan seminar hasil dan sidang hanya tersedia untuk tugas akhir berstatus Penelitian."
                        />
                    )
                )}

                {activeTab === "evaluasi" && (
                    <div className="space-y-6">
                        {/* Evaluasi Bimbingan: masa bimbingan, jatuh tempo, riwayat, dan "Isi Evaluasi" untuk Pembimbing 1 */}
                        <LecturerThesisGuidanceEvaluationCard thesisId={thesisId} />
                        {/* Pengajuan Perubahan Tugas Akhir: "Ajukan Perubahan" untuk Pembimbing 1, pengajuan berjalan, riwayat */}
                        <LecturerThesisChangeRequestCard thesisId={thesisId} />
                    </div>
                )}
            </div>
        </div>
    );
}
