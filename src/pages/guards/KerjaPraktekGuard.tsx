import { Outlet, useOutletContext } from "react-router-dom";
import { useStudentEligibility } from "@/hooks/shared";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function KerjaPraktekGuard() {
  // Pass through context from parent ProtectedLayout to children
  const context = useOutletContext();
  const { isLoading, canAccessKerjaPraktek, requirements } = useStudentEligibility();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memeriksa persyaratan..." />
      </div>
    );
  }

  if (!canAccessKerjaPraktek) {
    return (
      <RequirementsNotMet
        title="Kerja Praktek Belum Tersedia"
        description="Anda belum memenuhi persyaratan untuk mengakses fitur Kerja Praktek."
        requirements={[
          {
            label: `Minimal 90 SKS`,
            met: requirements.kerjaPraktek.sks.met,
            description: `SKS Anda saat ini: ${requirements.kerjaPraktek.sks.current} SKS`,
          },
        ]}
        homeUrl="/dashboard"
      />
    );
  }

  return <Outlet context={context} />;
}
