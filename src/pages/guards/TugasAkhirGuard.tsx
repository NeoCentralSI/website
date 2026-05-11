import { Outlet, useOutletContext } from "react-router-dom";
import { useStudentEligibility } from "@/hooks/shared";
import { useRole } from "@/hooks/shared/useRole";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function TugasAkhirGuard() {
  // Pass through context from parent ProtectedLayout to children
  const context = useOutletContext();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { isLoading, canAccessTugasAkhir, requirements } = useStudentEligibility();

  // Only check eligibility for students
  if (isStudentUser) {
    if (isLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan..." />
        </div>
      );
    }

    // Check eligibility requirements
    if (!canAccessTugasAkhir) {
      return (
        <RequirementsNotMet
          title="Tugas Akhir Belum Tersedia"
          description="Akses Tugas Akhir dibuka setelah snapshot SIA mengonfirmasi Anda sedang mengambil mata kuliah Tugas Akhir."
          requirements={[
            {
              label: "Snapshot mata kuliah Tugas Akhir valid",
              met: requirements.tugasAkhir.course.met,
              description: requirements.tugasAkhir.course.description,
            },
          ]}
          homeUrl="/dashboard"
        />
      );
    }
  }

  return <Outlet context={context} />;
}
