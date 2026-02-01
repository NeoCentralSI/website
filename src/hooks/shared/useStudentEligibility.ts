import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { useAuth } from "@/hooks/shared";

interface EligibilityResult {
  isLoading: boolean;
  sks: number;
  hasTugasAkhirCourse: boolean;
  canAccessKerjaPraktek: boolean;
  canAccessTugasAkhir: boolean;
  requirements: {
    kerjaPraktek: {
      sks: { met: boolean; current: number; required: number };
    };
    tugasAkhir: {
      sks: { met: boolean; current: number; required: number };
      course: { met: boolean };
    };
  };
}

export function useStudentEligibility(): EligibilityResult {
  const { user: authUser } = useAuth();
  const nim = authUser?.identityNumber;

  const { data: siaStudents, isLoading } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const siaStudent = siaStudents?.find((s) => s.nim === nim);
  const sks = siaStudent?.sksCompleted ?? authUser?.student?.sksCompleted ?? 0;
  const hasTugasAkhirCourse = !!siaStudent?.currentSemesterCourses?.some(
    (c) => (c.name || "").toLowerCase().includes("tugas akhir")
  );

  const canAccessKerjaPraktek = sks >= 90;
  const canAccessTugasAkhir = sks >= 110 && hasTugasAkhirCourse;

  return {
    isLoading,
    sks,
    hasTugasAkhirCourse,
    canAccessKerjaPraktek,
    canAccessTugasAkhir,
    requirements: {
      kerjaPraktek: {
        sks: { met: sks >= 90, current: sks, required: 90 },
      },
      tugasAkhir: {
        sks: { met: sks >= 110, current: sks, required: 110 },
        course: { met: hasTugasAkhirCourse },
      },
    },
  };
}
