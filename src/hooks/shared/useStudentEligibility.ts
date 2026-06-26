import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { checkMetopelEligibility } from "@/services/metopen.service";
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
  hasTugasAkhirCourse: boolean;
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
  const nim = authUser?.identityNumber;

  const { data: siaStudents, isLoading: siaLoading } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const { data: metopelEligibility, isLoading: metopelLoading } = useQuery({
    queryKey: ["metopel-eligibility"],
    queryFn: checkMetopelEligibility,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const siaStudent = siaStudents?.find((s) => s.nim === nim);
  const sks = siaStudent?.sksCompleted ?? authUser?.student?.sksCompleted ?? 0;
  const hasTugasAkhirCourseFromSia = !!siaStudent?.currentSemesterCourses?.some(
    (c) => (c.name || "").toLowerCase().includes("tugas akhir")
  );
  const takingThesisCourseFromBackend =
    typeof metopelEligibility?.takingThesisCourse === "boolean"
      ? metopelEligibility.takingThesisCourse
      : typeof authUser?.student?.takingThesisCourse === "boolean"
        ? authUser.student.takingThesisCourse
        : null;
  const hasTugasAkhirCourse = takingThesisCourseFromBackend ?? hasTugasAkhirCourseFromSia;

  const canAccessMetopel = metopelEligibility?.canAccess ?? false;
  const isMetopenReadOnly =
    metopelEligibility?.readOnly ?? metopelEligibility?.thesisPhase === "thesis";
  const isMetopenOnlyTrack = canAccessMetopel && !hasTugasAkhirCourse;

  const canAccessKerjaPraktek = sks >= 90;
  const canAccessTugasAkhir = hasTugasAkhirCourse;

  return {
    isLoading: siaLoading || metopelLoading,
    sks,
    hasTugasAkhirCourse,
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
        // BR-25 / anti-pattern #8 (audit F-0.2): gate Tugas Akhir = snapshot SIA
        // MK Tugas Akhir, BUKAN SKS hard-code. Objek `sks`/`module` lama dihapus
        // sebagai dead code agar tidak tersambung kembali sebagai gate.
        course: {
          met: hasTugasAkhirCourse,
          description: hasTugasAkhirCourse
            ? "Snapshot SIA mencatat Anda mengambil mata kuliah Tugas Akhir"
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
