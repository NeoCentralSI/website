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

    if (!canAccessTugasAkhir) {
      return (
        <RequirementsNotMet
          title="Tugas Akhir Belum Tersedia"
          description="Modul Tugas Akhir terbuka setelah snapshot SIA mencatat mata kuliah Tugas Akhir atau data tugas akhir mahasiswa sudah tersedia pada sistem. Untuk fase Metode Penelitian, unggah proposal dan catatan bimbingan informal lewat menu Metode Penelitian di sidebar."
          requirements={[
            {
              label: "Mengambil mata kuliah Tugas Akhir atau telah memiliki data tugas akhir",
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
