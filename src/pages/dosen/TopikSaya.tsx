import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TopikSaya() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: "Dosen", href: "/dashboard" },
      { label: "Topik Saya" },
    ],
    [],
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Topik Saya");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <Alert>
        <AlertTitle>Fitur tidak tersedia</AlertTitle>
        <AlertDescription>
          Publikasi topik dosen ke mahasiswa belum tersedia. Penentuan pembimbing memakai alur TA-01 dan TA-02.
        </AlertDescription>
      </Alert>
    </div>
  );
}
