import { useEffect } from "react";
import { Navigate, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Loading } from "@/components/ui/spinner";
import { useRole } from "@/hooks/shared";

export default function KelolaMetopen() {
  const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();
  const { isKoordinatorMetopen, isKadep, isSekdep, isLoading } = useRole();

  useEffect(() => {
    setBreadcrumbs([{ label: "Metode Penelitian" }]);
    setTitle("Metode Penelitian");
  }, [setBreadcrumbs, setTitle]);

  if (isLoading) {
    return <Loading size="lg" text="Mengarahkan..." />;
  }

  if (isKadep()) {
    return <Navigate to="/kelola/tugas-akhir/kadep" replace />;
  }

  if (isKoordinatorMetopen()) {
    return <Navigate to="/kelola/metopen/ta03b" replace />;
  }

  if (isSekdep()) {
    return <Navigate to="/kelola/tugas-akhir" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
