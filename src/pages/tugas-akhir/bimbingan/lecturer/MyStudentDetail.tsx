import { useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { ReadinessCardsRow } from "@/components/milestone/ReadinessParts";
import { DefenceReadinessCard } from "@/components/milestone/lecturer/DefenceReadinessCard";
import { SeminarReadinessCard } from "@/components/milestone/lecturer/SeminarReadinessCard";
import { LecturerThesisChangeRequestCard } from "@/components/thesis-change-request/LecturerThesisChangeRequestCard";
import { LecturerThesisGuidanceEvaluationCard } from "@/components/thesis-guidance-evaluation/LecturerThesisGuidanceEvaluationCard";
import { LecturerProposalRevisionCard } from "@/components/thesis-proposal/LecturerProposalRevisionCard";
import { ThesisActionBlockedAlert } from "@/components/thesis/ThesisActionBlockedAlert";
import { GuidanceHistorySection } from "@/components/tugas-akhir/lecturer/GuidanceHistorySection";
import { StudentDetailActionRibbon } from "@/components/tugas-akhir/lecturer/StudentDetailActionRibbon";
import { StudentDetailHeader, type SummarySupervisor } from "@/components/tugas-akhir/lecturer/StudentDetailHeader";
import { StudentDocumentsCard } from "@/components/tugas-akhir/lecturer/StudentDocumentsCard";
import { StudentMilestoneCard } from "@/components/tugas-akhir/lecturer/StudentMilestoneCard";
import { StudentThesisSummaryCard } from "@/components/tugas-akhir/lecturer/StudentThesisSummaryCard";
import { DETAIL_SECTIONS, getStudentDetailActionItems } from "@/components/tugas-akhir/lecturer/studentDetailPending";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useDefenceReadinessStatus, useSeminarReadinessStatus } from "@/hooks/milestone/useMilestone";
import { useThesisChangeContext } from "@/hooks/thesis-change-request/useThesisChangeRequest";
import { useEvaluationContext } from "@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation";
import { useLecturerProposalRevision } from "@/hooks/thesis-proposal/useProposalRevision";
import { formatRoleName, toTitleCaseName } from "@/lib/text";
import { getGuidanceActionBlockReason, getSupervisorPositionLabel, getThesisStatusLabel } from "@/lib/thesisLabels";
import { getStudentDetail } from "@/services/lecturerGuidance.service";

const MY_STUDENTS_PATH = "/tugas-akhir/bimbingan/lecturer/my-students";

/** Read-only reason when the viewer was replaced as supervisor (Paket E4, 1.1). */
const NO_LONGER_SUPERVISING_REASON = "Anda tidak lagi membimbing mahasiswa ini. Halaman ini hanya dapat dibaca.";

/**
 * Bimbingan > Mahasiswa > detail (supervisor), one compact page (Paket E4, 5): header with the
 * supervisors and the "Perlu tindakan Anda" ribbon; Informasi Tugas Akhir in one row of cards;
 * Milestone | Riwayat Bimbingan; Kesiapan Seminar | Kesiapan Sidang; Evaluasi | Perubahan.
 */
export default function LecturerMyStudentDetailPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { thesisId } = useParams<{ thesisId: string }>();

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

    // The cards below read the same queries; here they feed the header and the ribbon.
    const { data: readinessStatus } = useSeminarReadinessStatus(thesisId);
    const { data: defenceStatus } = useDefenceReadinessStatus(thesisId);
    const { data: changeContext } = useThesisChangeContext(thesisId, !!thesisId);
    const { data: evaluationContext } = useEvaluationContext(thesisId, !!thesisId);
    const { data: proposalRevision } = useLecturerProposalRevision(thesisId);

    // 10.7 / 2.4: the current phase is worked on; the other phase follows read-only in the same list.
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

    // Ended thesis (K15): read-only history. A replaced supervisor reads only (1.1).
    const isCancelled = detailData?.status === "failed" || detailData?.status === "completed";
    const noLongerSupervising = !!detailData?.noLongerSupervising;
    const isReadOnly = isCancelled || noLongerSupervising;
    // K14/K27: milestone/guidance writes for `research`, or `proposal` after Penetapan Pembimbing.
    const actionBlockReason = noLongerSupervising
        ? NO_LONGER_SUPERVISING_REASON
        : detailData
            ? getGuidanceActionBlockReason(detailData.status, "mahasiswa", {
                repeatingProposal: detailData.repeatingProposal,
                proposalPhaseOpen: detailData.proposalPhaseOpen,
            })
            : null;

    const isPembimbing1 = useMemo(() => {
        if (!detailData?.userRole || noLongerSupervising) return false;
        const role = detailData.userRole.toLowerCase();
        return role === "pembimbing 1" || role === "pembimbing1";
    }, [detailData?.userRole, noLongerSupervising]);

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

    // Supervisors for the header: the change context knows the positions; the readiness
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

    const actionItems = noLongerSupervising ? [] : getStudentDetailActionItems({
        milestones: phaseMilestones,
        isPembimbing1,
        isEnded: isCancelled,
        seminarReadiness: readinessStatus,
        defenceReadiness: defenceStatus,
        evaluationContext,
        changeContext,
        proposalRevisionWaiting: !!proposalRevision?.applicable && !!proposalRevision.canReview,
    });
    const showProposalRevision = detailData.status === "proposal" && !!detailData.repeatingProposal;

    return (
        <div className="p-6 space-y-6">
            {/* 1. Header and "Perlu tindakan Anda" */}
            <div className="space-y-4">
                <StudentDetailHeader
                    student={detailData.student}
                    status={detailData.status}
                    supervisors={supervisors}
                    onRefresh={() => void refetch()}
                    isRefreshing={isFetching && !isLoading}
                />
                <StudentDetailActionRibbon items={actionItems} />
            </div>

            {noLongerSupervising && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Tidak lagi membimbing</AlertTitle>
                    <AlertDescription>{NO_LONGER_SUPERVISING_REASON}</AlertDescription>
                </Alert>
            )}

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

            {!isReadOnly && <ThesisActionBlockedAlert reason={actionBlockReason} />}

            {/* 2. Informasi Tugas Akhir, one row of small cards */}
            <StudentThesisSummaryCard
                detail={detailData}
                topicName={changeContext?.thesis?.topic?.name}
                guidanceProgress={readinessStatus?.guidanceProgress}
            />

            {/* 3. Proposal revision (Lanjutan Paket P), then Milestone | Riwayat Bimbingan */}
            {showProposalRevision && (
                <section id={DETAIL_SECTIONS.revision} className="scroll-mt-6">
                    <LecturerProposalRevisionCard thesisId={thesisId} />
                </section>
            )}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <section id={DETAIL_SECTIONS.milestone} className="min-w-0 scroll-mt-6">
                    <StudentMilestoneCard
                        thesisId={thesisId}
                        milestones={phaseMilestones}
                        isPembimbing1={isPembimbing1}
                        isEnded={isReadOnly}
                        actionBlockReason={actionBlockReason}
                        readOnlyMilestones={otherPhaseMilestones}
                        readOnlyPhase={otherPhase}
                    />
                </section>
                <section className="min-w-0">
                    <GuidanceHistorySection guidanceHistory={detailData.guidanceHistory} />
                </section>
            </div>

            {/* 4. Kesiapan Seminar | Kesiapan Sidang */}
            <section id={DETAIL_SECTIONS.readiness} className="scroll-mt-6">
                <ReadinessCardsRow>
                    <SeminarReadinessCard thesisId={thesisId} studentName={detailData.student.fullName} />
                    <DefenceReadinessCard thesisId={thesisId} studentName={detailData.student.fullName} />
                </ReadinessCardsRow>
            </section>

            {/* 5. Evaluasi Bimbingan | Perubahan Tugas Akhir */}
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
                <section id={DETAIL_SECTIONS.evaluation} className="min-w-0 scroll-mt-6">
                    <LecturerThesisGuidanceEvaluationCard thesisId={thesisId} />
                </section>
                <section id={DETAIL_SECTIONS.change} className="min-w-0 scroll-mt-6">
                    <LecturerThesisChangeRequestCard thesisId={thesisId} />
                </section>
            </div>

            <StudentDocumentsCard detail={detailData} />
        </div>
    );
}
