import { useEffect, useMemo } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { MetopelOverviewTab } from "./MetopelOverviewTab";
import CariPembimbing from "./CariPembimbing";
import { Info } from "lucide-react";

const BASE_TAB_ITEMS: TabItem[] = [{ label: "Overview", to: "/metopel", end: true }];
const SEARCH_TAB: TabItem = { label: "Cari Pembimbing", to: "/metopel/cari-pembimbing" };

type MetopelOutletContext = LayoutContext & { isMetopenReadOnly?: boolean };

export default function Metopel() {
  const { setBreadcrumbs, setTitle, isMetopenReadOnly = false } =
    useOutletContext<MetopelOutletContext>();
  const location = useLocation();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { data: advisorAccess } = useAdvisorAccessState(isStudentUser);

  const tabs = useMemo(() => {
    const items = [...BASE_TAB_ITEMS];
    const canOpenAdvisorSearchTab =
      Boolean(advisorAccess?.canBrowseCatalog) || Boolean(advisorAccess?.hasBlockingRequest);

    if (!isMetopenReadOnly && !(advisorAccess?.hasOfficialSupervisor ?? false) && canOpenAdvisorSearchTab) {
      items.push(SEARCH_TAB);
    }

    return items;
  }, [
    advisorAccess?.canBrowseCatalog,
    advisorAccess?.hasBlockingRequest,
    advisorAccess?.hasOfficialSupervisor,
    isMetopenReadOnly,
  ]);

  const activeTabKey = useMemo(() => {
    if (location.pathname.startsWith("/metopel/cari-pembimbing")) return "search";
    return "overview";
  }, [location.pathname]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Metodologi Penelitian" }]);
    setTitle("Metodologi Penelitian");
  }, [setBreadcrumbs, setTitle]);

  const renderContent = () => {
    switch (activeTabKey) {
      case "search":
        return <CariPembimbing readOnly={isMetopenReadOnly} />;
      default:
        return <MetopelOverviewTab readOnly={isMetopenReadOnly} />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {isMetopenReadOnly && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Anda sudah melewati fase Metode Penelitian dan kini berada di fase Tugas Akhir.
            Halaman ini ditampilkan sebagai <strong>arsip</strong> — data dapat dilihat tetapi tidak dapat diubah.
          </p>
        </div>
      )}

      <section className="rounded-xl border bg-background px-3 py-3 shadow-sm sm:px-4 sm:py-4">
        <div className="mb-3 space-y-1 sm:mb-4">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            Metodologi Penelitian
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isMetopenReadOnly
              ? "Ringkasan arsip fase Metode Penelitian sebelum Anda masuk ke proses Tugas Akhir."
              : "Kelola pengajuan pembimbing, judul awal, penilaian proposal, dan status pengesahan judul pada fase Metode Penelitian."}
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
