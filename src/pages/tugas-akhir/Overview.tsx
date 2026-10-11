import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav } from "@/components/ui/tabs-nav";
import { StudentCurrentThesisPanel } from "@/components/tugas-akhir/student/StudentCurrentThesisPanel";
import { StudentThesisHistoryPanel } from "@/components/tugas-akhir/student/StudentThesisHistoryPanel";

const CURRENT_PATH = "/tugas-akhir";
const HISTORY_PATH = "/tugas-akhir/riwayat";

/**
 * Tugas Akhir > Overview (student). Always reachable: a student without a thesis sees an
 * empty state instead of a blocked page.
 */
export default function TugasAkhirOverviewPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { pathname } = useLocation();
  const isHistory = pathname.startsWith(HISTORY_PATH);

  const breadcrumbs = useMemo(
    () => [{ label: "Tugas Akhir", href: CURRENT_PATH }, { label: isHistory ? "Riwayat" : "Tugas Akhir Saat Ini" }],
    [isHistory],
  );
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle("Overview Tugas Akhir");
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tugas Akhir</h1>
        <p className="text-muted-foreground">Tugas akhir yang sedang berjalan dan riwayat tugas akhir Anda</p>
      </div>

      <div>
        <TabsNav
          tabs={[
            { label: "Tugas Akhir Saat Ini", to: CURRENT_PATH, end: true },
            { label: "Riwayat", to: HISTORY_PATH },
          ]}
        />
        {isHistory ? <StudentThesisHistoryPanel /> : <StudentCurrentThesisPanel />}
      </div>
    </div>
  );
}
