import { useQuery } from "@tanstack/react-query";
import { checkMetopelEligibility } from "@/services/metopen.service";
import { useAuth } from "./useAuth";
import { useRole } from "./useRole";

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
  hasTugasAkhirCourse: boolean;
  hasExistingThesis: boolean;
  canAccessKerjaPraktek: boolean;
  canAccessTugasAkhir: boolean;
  canAccessMetopel: boolean;
  isMetopenReadOnly: boolean;
  isMetopenOnlyTrack: boolean;
  requirements: {
    kerjaPraktek: {
      sks: NumericRequirementStatus;
    };
    tugasAkhir: {
      // F-0.2: gate TA = snapshot SIA MK Tugas Akhir (course), bukan SKS hard-code (BR-25).
      course: RequirementStatus;
    };
    metopel: {
      // Canon §5.1 (F-0.1): eligibility = snapshot SIA semata (tanpa gate semester).
      eligibility: RequirementStatus;
    };
  };
}

export function useStudentEligibility(): EligibilityResult {
  const { user: authUser } = useAuth();
  const { isStudent } = useRole();
  const nim = authUser?.identityNumber;
  // Only fire API calls for students — lecturers/admins also have identityNumber
  // (NIP/NIDN) but the backend returns 403, causing constant error logs.
  const isStudentUser = isStudent();

  const { data: metopelEligibility, isLoading: metopelLoading } = useQuery({
    queryKey: ["metopel-eligibility"],
    queryFn: checkMetopelEligibility,
    enabled: !!nim && isStudentUser,
    staleTime: 5 * 60 * 1000,
  });

  const sks = authUser?.student?.sksCompleted ?? 0;
  const takingThesisCourseFromBackend =
    typeof metopelEligibility?.takingThesisCourse === "boolean"
      ? metopelEligibility.takingThesisCourse
      : typeof authUser?.student?.takingThesisCourse === "boolean"
        ? authUser.student.takingThesisCourse
        : null;
  const hasTugasAkhirCourse = takingThesisCourseFromBackend === true;
  const hasExistingThesis = Boolean(metopelEligibility?.thesisId);

  const canAccessMetopel = metopelEligibility?.canAccess ?? false;
  const isMetopenReadOnly =
    metopelEligibility?.readOnly ?? metopelEligibility?.thesisPhase === "thesis";
  const isMetopenOnlyTrack = canAccessMetopel && !hasTugasAkhirCourse;

  const canAccessKerjaPraktek = sks >= 90;
  const canAccessTugasAkhir = hasTugasAkhirCourse || hasExistingThesis;

  return {
    isLoading: metopelLoading,
    sks,
    hasTugasAkhirCourse,
    hasExistingThesis,
    canAccessKerjaPraktek,
    canAccessTugasAkhir,
    canAccessMetopel,
    isMetopenReadOnly,
    isMetopenOnlyTrack,
    requirements: {
      kerjaPraktek: {
        sks: { met: sks >= 90, current: sks, required: 90 },
      },
      tugasAkhir: {
        // Snapshot SIA tetap menjadi sumber utama. Data thesis yang sudah ada
        // menjadi fallback kompatibilitas bagi mahasiswa hasil migrasi.
        course: {
          met: canAccessTugasAkhir,
          description: hasTugasAkhirCourse
            ? "Snapshot SIA mencatat Anda mengambil mata kuliah Tugas Akhir"
            : hasExistingThesis
              ? "Data tugas akhir mahasiswa sudah tersedia pada sistem"
              : "Snapshot SIA belum mencatat Anda mengambil mata kuliah Tugas Akhir",
        },
      },
      metopel: {
        // Canon §5.1 (audit F-0.1): eligibility Metopen = snapshot SIA semata.
        // Objek `semester`/`course` (gate semester-6 non-kanonis) dihapus.
        eligibility: {
          met: canAccessMetopel,
          description: canAccessMetopel
            ? "Snapshot eligibility Metopen aktif"
            : "Snapshot eligibility Metopen belum aktif",
        },
      },
    },
  };
}
