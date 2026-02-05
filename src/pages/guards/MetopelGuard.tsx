import { Outlet, useOutletContext } from "react-router-dom";
import { useStudentEligibility } from "@/hooks/shared";
import { useRole } from "@/hooks/shared/useRole";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function MetopelGuard() {
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

    // Metode Penelitian uses the same requirements as Tugas Akhir
    if (!canAccessTugasAkhir) {
      return (
        <RequirementsNotMet
          title="Metode Penelitian Belum Tersedia"
          description="Anda belum memenuhi persyaratan untuk mengakses fitur Metode Penelitian."
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
