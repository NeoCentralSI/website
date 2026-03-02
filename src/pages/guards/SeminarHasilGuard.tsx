import { Outlet, useOutletContext } from "react-router-dom";
import { useStudentEligibility } from "@/hooks/shared";
import { useRole } from "@/hooks/shared/useRole";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { Loading } from "@/components/ui/spinner";

export default function SeminarHasilGuard() {
  const context = useOutletContext();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { isLoading, canAccessSeminarHasil, requirements } = useStudentEligibility();

  if (isStudentUser) {
    if (isLoading) {
      return (
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loading size="lg" text="Memeriksa persyaratan seminar hasil..." />
        </div>
      );
    }

    if (!canAccessSeminarHasil) {
      return (
        <RequirementsNotMet
          title="Seminar Hasil Belum Tersedia"
          description="Anda belum memenuhi persyaratan untuk mengakses fitur Seminar Hasil."
          requirements={[
            {
              label: "Minimal Semester 6",
              met: requirements.seminarHasil.semester.met,
              description: `Semester Anda saat ini: ${requirements.seminarHasil.semester.current}`,
            },
            {
              label: "Minimal 110 SKS",
              met: requirements.seminarHasil.sks.met,
              description: `SKS Anda saat ini: ${requirements.seminarHasil.sks.current} SKS`,
            },
            {
              label: "Mengambil mata kuliah Tugas Akhir",
              met: requirements.seminarHasil.course.met,
              description: "Anda harus mengambil mata kuliah Tugas Akhir semester ini",
            },
            {
              label: "Lulus mata kuliah Kerja Praktik (KP)",
              met: requirements.seminarHasil.internship.met,
              description: "Syarat SOP seminar hasil mewajibkan mata kuliah KP sudah lulus",
            },
          ]}
          homeUrl="/tugas-akhir"
        />
      );
    }
  }

  return <Outlet context={context} />;
}