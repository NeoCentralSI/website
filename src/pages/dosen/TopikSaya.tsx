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
    <div className="p-4">
      <Alert>
        <AlertTitle>Publish topik dosen tidak aktif</AlertTitle>
        <AlertDescription>
          Marketplace topik dosen yang dipublikasikan ke mahasiswa tidak menjadi bagian dari release
          aktif SIMPTA ini. Penentuan pembimbing difokuskan pada alur TA-01 dan TA-02.
        </AlertDescription>
      </Alert>
    </div>
  );
}
