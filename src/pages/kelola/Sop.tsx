import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { SopManager } from "@/components/kelola/SopManager";

export default function KelolaSopPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(() => [{ label: "Kelola" }, { label: "Panduan" }], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Kelola Panduan");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return <SopManager />;
}
