import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { RubricMetopenManagementPanel } from "@/components/kelola/rubric-metopen/RubricMetopenManagementPanel";

/**
 * Master CPMK + rubrik penilaian Metode Penelitian (TA-03A/TA-03B).
 * Surface milik domain Metopen; RBAC mutasi = Sekdep (`/rubric-metopen`).
 */
export default function MetopenCpmkRubric() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Metode Penelitian", href: "/kelola/metopen" },
      { label: "CPMK & Rubrik Penilaian" },
    ]);
    setTitle("CPMK & Rubrik Penilaian");
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">
          CPMK &amp; Rubrik Penilaian
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Atur capaian pembelajaran Metode Penelitian, lalu susun rubrik penilaian proposal
          (TA-03A maks 75, TA-03B maks 25).
        </p>
      </div>

      <RubricMetopenManagementPanel />
    </div>
  );
}
