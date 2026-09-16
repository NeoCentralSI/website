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
  const { isLoading, canAccessMetopel, requirements } = useStudentEligibility();

  // Only check eligibility for students
  if (isStudentUser) {
    if (isLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan..." />
        </div>
      );
    }

    if (!canAccessMetopel) {
      // Canon §5.1 (audit F-0.1 / OQ-0.1): eligibility Metopen = snapshot SIA
      // `eligibleMetopen` semata (tanpa gate semester/SKS hard-code). Tampilkan
      // alasan kanonis yang sebenarnya, bukan syarat semester-6 non-kanonis.
      // Pola mengikuti TugasAkhirGuard (satu requirement = snapshot SIA).
      return (
        <RequirementsNotMet
          title="Metode Penelitian Belum Tersedia"
          description="Akses Metode Penelitian terbuka setelah snapshot SIA mencatat Anda eligible Metopen. Bila Anda merasa sudah memenuhi syarat akademik, hubungi Admin/Akademik untuk sinkronisasi data SIA."
          requirements={[
            {
              label: "Snapshot SIA: eligible Metode Penelitian",
              met: requirements.metopel.eligibility.met,
              description: requirements.metopel.eligibility.description,
            },
          ]}
          homeUrl="/dashboard"
        />
      );
    }
  }

  return <Outlet context={context} />;
}
