import { useQuery } from "@tanstack/react-query";
import { getCachedStudentsFromSia } from "@/services/sia.service";
import { checkMetopelEligibility } from "@/services/metopen.service";
import { useAuth } from "@/hooks/shared";

interface EligibilityResult {
  isLoading: boolean;
  sks: number;
  semester: number;
  hasTugasAkhirCourse: boolean;
  hasMetopenCourse: boolean;
  canAccessKerjaPraktek: boolean;
  canAccessTugasAkhir: boolean;
  canAccessMetopen: boolean;
  requirements: {
    kerjaPraktek: {
      sks: { met: boolean; current: number; required: number };
    };
    tugasAkhir: {
      sks: { met: boolean; current: number; required: number };
      course: { met: boolean };
    };
    metopen: {
      course: { met: boolean };
    };
  };
}

export function useStudentEligibility(): EligibilityResult {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const nim = authUser?.identityNumber;

  // Primary source: SIA cache (when admin has synced data)
  const { data: siaStudents, isLoading: isSiaLoading } = useQuery({
    queryKey: ["sia-cached-students"],
    queryFn: getCachedStudentsFromSia,
    enabled: !!nim,
    staleTime: 5 * 60 * 1000,
    retry: 0, // Don't retry — if SIA fails, fall through to DB checks immediately
  });

  // Always fetch backend eligibility check in parallel.
  // Backend checks thesis status "Metopel" in DB as proxy for SIA enrollment.
  // This is the authoritative fallback when SIA cache is unavailable.
  const { data: backendEligibility, isLoading: isBackendEligibilityLoading } = useQuery({
    queryKey: ["metopen-eligibility-check", authUser?.id],
    queryFn: checkMetopelEligibility,
    enabled: !!nim && !!authUser?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const siaStudent = siaStudents?.find((s) => s.nim === nim);
  const hasSiaData = !!siaStudent;

  // SKS: from SIA if available, else from user profile (auth/me endpoint)
  const sks = Math.max(
    siaStudent?.sksCompleted ?? 0,
    authUser?.student?.sksCompleted ?? 0
  );
  const semester = siaStudent?.currentSemester ?? 0;

  // Metopen course:
  // - Backend (thesis status "Metopel") is authoritative when it says canAccess.
  // - When backend says no, fall back to SIA currentSemesterCourses if available.
  // This prevents SIA cache (which may be incomplete) from overriding DB-verified eligibility.
  const hasMetopenCourse =
    backendEligibility?.canAccess === true ||
    (hasSiaData &&
      !!siaStudent?.currentSemesterCourses?.some(
        (c) => (c.name || "").toLowerCase().includes("metodologi penelitian")
      ));

  // Tugas Akhir course:
  // - If SIA has data: check currentSemesterCourses for "Tugas Akhir"
  // - Else: SKS >= 110 is sufficient (SIA integration pending)
  const hasTugasAkhirCourse = hasSiaData
    ? !!siaStudent?.currentSemesterCourses?.some(
        (c) => (c.name || "").toLowerCase().includes("tugas akhir")
      )
    : sks >= 110;

  const canAccessKerjaPraktek = sks >= 90;
  const canAccessTugasAkhir = sks >= 110 && hasTugasAkhirCourse;
  const canAccessMetopen = hasMetopenCourse;

  // Loading: wait for auth + both SIA and backend eligibility to resolve
  const isLoading = isAuthLoading || isSiaLoading || isBackendEligibilityLoading;

  return {
    isLoading,
    sks,
    semester,
    hasTugasAkhirCourse,
    hasMetopenCourse,
    canAccessKerjaPraktek,
    canAccessTugasAkhir,
    canAccessMetopen,
    requirements: {
      kerjaPraktek: {
        sks: { met: sks >= 90, current: sks, required: 90 },
      },
      tugasAkhir: {
        sks: { met: sks >= 110, current: sks, required: 110 },
        course: { met: hasTugasAkhirCourse },
      },
      metopen: {
        course: { met: hasMetopenCourse },
      },
    },
  };
}
