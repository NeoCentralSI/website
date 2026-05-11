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
      return (
        <RequirementsNotMet
          title="Metode Penelitian Belum Tersedia"
          description="Akses dibuka berdasarkan snapshot eligibility dari SIA. Hubungi admin DSI bila Anda yakin sudah layak namun status di sini belum berubah."
          requirements={[
            {
              label: "Eligibility Metode Penelitian dari SIA",
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
