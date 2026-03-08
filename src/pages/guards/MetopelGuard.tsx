import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useAdvisorAccessState, useStudentEligibility } from "@/hooks/shared";
import { useRole } from "@/hooks/shared/useRole";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function MetopelGuard() {
  // Pass through context from parent ProtectedLayout to children
  const context = useOutletContext();
  const location = useLocation();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { isLoading, canAccessMetopen, requirements } = useStudentEligibility();
  const {
    data: advisorAccess,
    isLoading: isAdvisorAccessLoading,
  } = useAdvisorAccessState(isStudentUser);

  // Only check eligibility for students
  if (isStudentUser) {
    if (isLoading || isAdvisorAccessLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan..." />
        </div>
      );
    }

    // Metode Penelitian only requires having taken the "Metodologi Penelitian" course
    if (!canAccessMetopen) {
      return (
        <RequirementsNotMet
          title="Metode Penelitian Belum Tersedia"
          description="Anda belum memenuhi persyaratan untuk mengakses fitur Metode Penelitian."
          requirements={[
            {
              label: "Mengambil mata kuliah Metodologi Penelitian",
              met: requirements.metopen.course.met,
              description: "Anda harus mengambil mata kuliah Metodologi Penelitian semester ini",
            },
          ]}
          homeUrl="/dashboard"
        />
      );
    }

    if (location.pathname.startsWith("/metopel/cari-pembimbing") && !advisorAccess?.canBrowseCatalog) {
      return (
        <RequirementsNotMet
          title="Cari Pembimbing Belum Tersedia"
          description={advisorAccess?.reason}
          requirements={[
            {
              label: "Data TA/Metopen tersedia",
              met: Boolean(advisorAccess?.thesisId),
            },
            {
              label: "Milestone gate Metopen sudah selesai",
              met: advisorAccess?.gateOpen ?? false,
            },
            {
              label: "Belum memiliki pembimbing resmi",
              met: !(advisorAccess?.hasOfficialSupervisor ?? false),
            },
            {
              label: "Tidak ada pengajuan pembimbing yang masih berjalan",
              met: !(advisorAccess?.hasBlockingRequest ?? false),
            },
          ]}
          homeUrl="/metopel"
        />
      );
    }

    if (location.pathname.startsWith("/metopel/logbook") && !advisorAccess?.canOpenLogbook) {
      return (
        <RequirementsNotMet
          title="Logbook Bimbingan Belum Tersedia"
          description={advisorAccess?.reason || "Logbook bimbingan hanya terbuka setelah pembimbing resmi ditetapkan."}
          requirements={[
            {
              label: "Sudah memiliki pembimbing resmi",
              met: advisorAccess?.hasOfficialSupervisor ?? false,
            },
          ]}
          homeUrl="/metopel"
        />
      );
    }
  }

  return <Outlet context={context} />;
}
