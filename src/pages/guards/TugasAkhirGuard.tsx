import { Outlet, useOutletContext } from "react-router-dom";
import { useStudentEligibility, useAuth } from "@/hooks/shared";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function TugasAkhirGuard() {
  // Pass through context from parent ProtectedLayout to children
  const context = useOutletContext();
  const { user } = useAuth();
  const { isLoading, canAccessTugasAkhir, requirements } = useStudentEligibility();

  // Non-student roles (dosen, staff, admin) can always access Tugas Akhir features
  const isStudent = user?.role === "mahasiswa";
  
  // Only check eligibility for students
  if (isStudent) {
    if (isLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan..." />
        </div>
      );
    }

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
