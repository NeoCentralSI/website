import { useAuth } from "./useAuth";

type RequirementStatus = {
  met: boolean;
  description?: string;
};

type NumericRequirementStatus = RequirementStatus & {
  current: number;
  required: number;
};

interface EligibilityResult {
  isLoading: boolean;
  sks: number;
  /** SIA flag of the running semester: the student takes Tugas Akhir (plan 10.6). */
  hasTugasAkhirCourse: boolean;
  /** SIA flag of the running semester: the student takes Metode Penelitian. */
  takesResearchMethod: boolean;
  canAccessKerjaPraktek: boolean;
  /** K14: the Tugas Akhir pages are always reachable; their actions explain what is not allowed yet. */
  canAccessTugasAkhir: boolean;
  requirements: {
    kerjaPraktek: {
      sks: NumericRequirementStatus;
    };
  };
}

/**
 * Student eligibility shared by Kerja Praktik (SKS) and Tugas Akhir. The Tugas Akhir side no
 * longer gates pages (K14); it only reports the SIA flags of the running semester from the
 * user profile.
 */
export function useStudentEligibility(): EligibilityResult {
  const { user: authUser } = useAuth();
  const sks = authUser?.student?.sksCompleted ?? 0;
  const canAccessKerjaPraktek = sks >= 90;

  return {
    isLoading: false,
    sks,
    hasTugasAkhirCourse: authUser?.student?.takingThesisCourse === true,
    takesResearchMethod: authUser?.student?.eligibleResearchMethod === true,
    canAccessKerjaPraktek,
    canAccessTugasAkhir: true,
    requirements: {
      kerjaPraktek: {
        sks: { met: canAccessKerjaPraktek, current: sks, required: 90 },
      },
    },
  };
}
