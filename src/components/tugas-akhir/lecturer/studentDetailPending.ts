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
    return !!status && !!status.currentUserRole && !status.currentUserHasApproved && !status.approveBlockedReason;
}

export interface StudentDetailPendingCounts {
    /** Tab "Progres": milestones waiting for the viewer's review. */
    progress: number;
    /** Tab "Kesiapan Seminar & Sidang": readiness approvals the viewer can give now. */
    readiness: number;
    /** Tab "Evaluasi & Perubahan": an evaluation due and a change request at the viewer's step. */
    evaluation: number;
}

/** What waits for the signed-in supervisor on each tab of the student detail page. */
export function getStudentDetailPendingCounts(input: {
    milestones: StudentDetail["milestones"] | undefined;
    isPembimbing1: boolean;
    isEnded: boolean;
    /** Null/undefined when the card is not shown. */
    seminarReadiness: ReadinessStatusBase | null | undefined;
    defenceReadiness: ReadinessStatusBase | null | undefined;
    evaluationContext: ThesisGuidanceEvaluationContext | null | undefined;
    changeContext: ThesisChangeContext | null | undefined;
}): StudentDetailPendingCounts {
    const evaluationDue = input.evaluationContext?.viewerRole === "pembimbing_1" && input.evaluationContext.canSubmit;
    const changeAtMyStep = !!input.changeContext?.openRequest?.viewer.canDecideAsLecturer;
    return {
        progress: countMilestonesAwaitingReview(input.milestones, input),
        readiness: [input.seminarReadiness, input.defenceReadiness].filter(isReadinessAwaitingViewer).length,
        evaluation: (evaluationDue ? 1 : 0) + (changeAtMyStep ? 1 : 0),
    };
}
