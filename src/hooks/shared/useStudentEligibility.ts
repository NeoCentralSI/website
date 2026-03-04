import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { useAuth } from "@/hooks/shared";

interface EligibilityResult {
  isLoading: boolean;
  sks: number;
  semester: number;
  hasTugasAkhirCourse: boolean;
  hasPassedInternship: boolean;
  canAccessKerjaPraktek: boolean;
  canAccessTugasAkhir: boolean;
  canAccessSeminarHasil: boolean;
  requirements: {
    kerjaPraktek: {
      sks: { met: boolean; current: number; required: number };
    };
    tugasAkhir: {
      sks: { met: boolean; current: number; required: number };
      course: { met: boolean };
    };
    seminarHasil: {
      semester: { met: boolean; current: number; required: number };
      sks: { met: boolean; current: number; required: number };
      course: { met: boolean };
      internship: { met: boolean };
    };
  };
}

export function useStudentEligibility(): EligibilityResult {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const nim = authUser?.identityNumber;

  const { data: siaStudents, isLoading: isSiaLoading } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
  });

  const siaStudent = siaStudents?.find((s) => s.nim === nim);
  const sks = siaStudent?.sksCompleted ?? authUser?.student?.sksCompleted ?? 0;
  const semester = siaStudent?.currentSemester ?? 0;
  const hasTugasAkhirCourse = !!siaStudent?.currentSemesterCourses?.some(
    (c) => (c.name || "").toLowerCase().includes("tugas akhir")
  );
  const hasPassedInternship = !!siaStudent?.internshipCompleted;

  const canAccessKerjaPraktek = sks >= 90;
  const canAccessTugasAkhir = sks >= 110 && hasTugasAkhirCourse;
  const canAccessSeminarHasil =
    semester >= 6 &&
    sks >= 110 &&
    hasTugasAkhirCourse &&
    hasPassedInternship;

  return {
    isLoading: isAuthLoading || isSiaLoading,
    sks,
    semester,
    hasTugasAkhirCourse,
    hasPassedInternship,
    canAccessKerjaPraktek,
    canAccessTugasAkhir,
    canAccessSeminarHasil,
    requirements: {
      kerjaPraktek: {
        sks: { met: sks >= 90, current: sks, required: 90 },
      },
      tugasAkhir: {
        sks: { met: sks >= 110, current: sks, required: 110 },
        course: { met: hasTugasAkhirCourse },
      },
      seminarHasil: {
        semester: { met: semester >= 6, current: semester, required: 6 },
        sks: { met: sks >= 110, current: sks, required: 110 },
        course: { met: hasTugasAkhirCourse },
        internship: { met: hasPassedInternship },
      },
    },
  };
}
