import type { StudentDetail } from "@/services/lecturerGuidance.service";
import type { ReadinessStatusBase } from "@/types/milestone.types";
import type { ThesisChangeContext } from "@/types/thesis-change-request.types";
import type { ThesisGuidanceEvaluationContext } from "@/types/thesis-guidance-evaluation.types";

/** Milestones the supervisor can review now (only Pembimbing 1 reviews, never on an ended thesis). */
export function countMilestonesAwaitingReview(
    milestones: StudentDetail["milestones"] | undefined,
    { isPembimbing1, isEnded }: { isPembimbing1: boolean; isEnded: boolean },
): number {
    if (!isPembimbing1 || isEnded) return 0;
    return (milestones ?? []).filter((milestone) => milestone.status === "pending_review").length;
}

/** True when the signed-in supervisor can press "Setujui" on this readiness card now. */
export function isReadinessAwaitingViewer(status: ReadinessStatusBase | null | undefined): boolean {
    return !!status && !!status.currentUserRole && !status.currentUserHasApproved && !status.approveBlockedReason && !status.isPassed;
}

/** Section anchors of the single-page student detail (Paket E4, 5). */
export const DETAIL_SECTIONS = {
    milestone: "bagian-milestone",
    revision: "bagian-revisi-proposal",
    readiness: "bagian-kesiapan",
    evaluation: "bagian-evaluasi",
    change: "bagian-perubahan",
} as const;

export interface DetailActionItem {
    key: string;
    label: string;
    /** Id of the section the item scrolls to. */
    target: string;
}

/**
 * "Perlu tindakan Anda" (Paket E4, 5): what waits for the signed-in supervisor on this student,
 * each with the section it scrolls to. Empty when nothing waits.
 */
export function getStudentDetailActionItems(input: {
    milestones: StudentDetail["milestones"] | undefined;
    isPembimbing1: boolean;
    isEnded: boolean;
    seminarReadiness: ReadinessStatusBase | null | undefined;
    defenceReadiness: ReadinessStatusBase | null | undefined;
    evaluationContext: ThesisGuidanceEvaluationContext | null | undefined;
    changeContext: ThesisChangeContext | null | undefined;
    /** A repeated proposal waiting for this supervisor's review. */
    proposalRevisionWaiting: boolean;
}): DetailActionItem[] {
    // An ended thesis (Selesai/Gagal) is read-only: nothing waits for the supervisor.
    if (input.isEnded) return [];
    const items: DetailActionItem[] = [];
    const milestones = countMilestonesAwaitingReview(input.milestones, input);
    if (milestones > 0) {
        items.push({ key: "milestone", label: `${milestones} milestone menunggu tinjauan`, target: DETAIL_SECTIONS.milestone });
    }
    if (input.proposalRevisionWaiting) {
        items.push({ key: "revision", label: "Proposal revisi menunggu tinjauan", target: DETAIL_SECTIONS.revision });
    }
    if (isReadinessAwaitingViewer(input.seminarReadiness)) {
        items.push({ key: "seminar", label: "Kesiapan seminar hasil menunggu persetujuan Anda", target: DETAIL_SECTIONS.readiness });
    }
    if (isReadinessAwaitingViewer(input.defenceReadiness)) {
        items.push({ key: "defence", label: "Kesiapan sidang menunggu persetujuan Anda", target: DETAIL_SECTIONS.readiness });
    }
    if (input.evaluationContext?.viewerRole === "pembimbing_1" && input.evaluationContext.canSubmit) {
        items.push({ key: "evaluation", label: "Evaluasi bimbingan jatuh tempo", target: DETAIL_SECTIONS.evaluation });
    }
    if (input.changeContext?.openRequest?.viewer.canDecideAsLecturer) {
        items.push({ key: "change", label: "Pengajuan perubahan menunggu persetujuan Anda", target: DETAIL_SECTIONS.change });
    }
    return items;
}
