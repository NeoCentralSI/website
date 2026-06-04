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
      sks: NumericRequirementStatus;
      course: RequirementStatus;
      module: RequirementStatus;
    };
    metopel: {
      semester: NumericRequirementStatus;
      course: RequirementStatus;
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
  const hasTugasAkhirCourse = !!siaStudent?.currentSemesterCourses?.some(
    (c) => (c.name || "").toLowerCase().includes("tugas akhir")
  );

  const metopelSemester = metopelEligibility?.semester ?? siaStudent?.currentSemester ?? 0;
  const isMinSemester6 = metopelEligibility?.isMinSemester6 ?? metopelSemester >= 6;
  const hasMetopenCourse =
    metopelEligibility?.hasMetopenCourse ?? Boolean(metopelEligibility?.eligibleMetopen);
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
        sks: {
          met: sks >= 110,
          current: sks,
          required: 110,
          description: `SKS Anda saat ini: ${sks} SKS`,
        },
        course: {
          met: hasTugasAkhirCourse,
          description: hasTugasAkhirCourse
            ? "Snapshot SIA mencatat Anda mengambil mata kuliah Tugas Akhir"
            : "Snapshot SIA belum mencatat Anda mengambil mata kuliah Tugas Akhir",
        },
        module: {
          met: canAccessTugasAkhir,
          description: canAccessTugasAkhir
            ? "Modul Tugas Akhir aktif"
            : "Gunakan menu Metode Penelitian sampai snapshot MK Tugas Akhir aktif",
        },
      },
      metopel: {
        semester: {
          met: isMinSemester6,
          current: metopelSemester,
          required: 6,
        },
        course: { met: hasMetopenCourse },
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
