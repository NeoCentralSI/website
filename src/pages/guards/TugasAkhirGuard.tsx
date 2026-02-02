import { Outlet, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useStudentEligibility } from "@/hooks/shared";
import { useRole } from "@/hooks/shared/useRole";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";
import { ThesisDeletedAlert } from "@/components/tugas-akhir/student/ThesisDeletedAlert";
import { ThesisPendingChangeAlert, useHasPendingChangeRequest } from "@/components/tugas-akhir/student/ThesisPendingChangeAlert";
import { ChangeRequestApprovedAlert, useHasApprovedChangeRequest } from "@/components/tugas-akhir/student/ChangeRequestApprovedAlert";
import { checkThesisDeletionNotification } from "@/services/notification.service";

export default function TugasAkhirGuard() {
  // Pass through context from parent ProtectedLayout to children
  const context = useOutletContext();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { isLoading, canAccessTugasAkhir, requirements } = useStudentEligibility();
  
  // Check if student has thesis deletion notification (FAILED thesis)
  const { data: thesisDeletionData, isLoading: isDeletionLoading } = useQuery({
    queryKey: ['check-thesis-deleted'],
    queryFn: checkThesisDeletionNotification,
    staleTime: 5 * 60 * 1000,
    enabled: isStudentUser,
  });
  
  // Check if student has pending change request
  const { hasPendingRequest, isLoading: isPendingLoading } = useHasPendingChangeRequest();
  
  // Check if student has approved change request (thesis deleted for re-registration)
  const { hasApprovedRequest, isLoading: isApprovedLoading } = useHasApprovedChangeRequest();
  
  const hasThesisDeletionNotification = !!thesisDeletionData?.data?.notification;

  // Only check eligibility for students
  if (isStudentUser) {
    if (isLoading || isDeletionLoading || isPendingLoading || isApprovedLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan..." />
        </div>
      );
    }

    // Priority 1: Show thesis deleted alert (FAILED thesis)
    if (hasThesisDeletionNotification) {
      return <ThesisDeletedAlert />;
    }

    // Priority 2: Show approved change request alert (need to re-register)
    if (hasApprovedRequest) {
      return <ChangeRequestApprovedAlert />;
    }

    // Priority 3: Show pending change request alert
    if (hasPendingRequest) {
      return <ThesisPendingChangeAlert />;
    }

    // Priority 4: Check eligibility requirements
    if (!canAccessTugasAkhir) {
      return (
        <RequirementsNotMet
          title="Tugas Akhir Belum Tersedia"
          description="Anda belum memenuhi persyaratan untuk mengakses fitur Tugas Akhir."
          requirements={[
            {
              label: `Minimal 110 SKS`,
              met: requirements.tugasAkhir.sks.met,
              description: `SKS Anda saat ini: ${requirements.tugasAkhir.sks.current} SKS`,
            },
            {
              label: "Mengambil mata kuliah Tugas Akhir",
              met: requirements.tugasAkhir.course.met,
              description: "Anda harus mengambil mata kuliah Tugas Akhir semester ini",
            },
          ]}
          homeUrl="/dashboard"
        />
      );
    }
  }

  return <Outlet context={context} />;
}
