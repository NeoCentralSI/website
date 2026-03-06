import { useEffect, useMemo } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { MetopelOverviewTab } from "./MetopelOverviewTab";
import { MetopelTasksTab } from "./MetopelTasksTab";
import { MetopelLogbookTab } from "./MetopelLogbookTab";
import CariPembimbing from "./CariPembimbing";

const BASE_TAB_ITEMS: TabItem[] = [
  { label: "Overview", to: "/metopel", end: true },
  { label: "Tugas", to: "/metopel/tugas" },
];
const SEARCH_TAB: TabItem = { label: "Cari Pembimbing", to: "/metopel/cari-pembimbing" };
const LOGBOOK_TAB: TabItem = { label: "Logbook Bimbingan", to: "/metopel/logbook" };

export default function Metopel() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const location = useLocation();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { data: advisorAccess } = useAdvisorAccessState(isStudentUser);

  const tabs = useMemo(() => {
    const items = [...BASE_TAB_ITEMS];

    if (!(advisorAccess?.hasOfficialSupervisor ?? false)) {
      items.push(SEARCH_TAB);
    }

    if (advisorAccess?.canOpenLogbook) {
      items.push(LOGBOOK_TAB);
    }

    return items;
  }, [advisorAccess?.canOpenLogbook, advisorAccess?.hasOfficialSupervisor]);

  const activeTabKey = useMemo(() => {
    if (location.pathname.startsWith("/metopel/cari-pembimbing")) return "search";
    if (location.pathname.startsWith("/metopel/tugas")) return "tasks";
    if (location.pathname.startsWith("/metopel/logbook")) return "logbook";
    return "overview";
  }, [location.pathname]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Metodologi Penelitian" }]);
    setTitle("Metodologi Penelitian");
  }, [setBreadcrumbs, setTitle]);

  const renderContent = () => {
    switch (activeTabKey) {
      case "tasks":
        return <MetopelTasksTab />;
      case "search":
        return <CariPembimbing />;
      case "logbook":
        return <MetopelLogbookTab />;
      default:
        return <MetopelOverviewTab />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-6">
      <section className="rounded-xl border bg-background px-3 py-3 shadow-sm sm:px-4 sm:py-4">
        <div className="mb-3 space-y-1 sm:mb-4">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            Metodologi Penelitian
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Kelola progres, tugas, pencarian pembimbing, dan logbook dalam satu alur yang terstruktur.
          </p>
        </div>
        <TabsNav tabs={tabs} />
      </section>

      <section className="rounded-xl border bg-background p-3 shadow-sm animate-in fade-in duration-300 sm:p-4 lg:p-5">
        {renderContent()}
      </section>
    </div>
  );
}
