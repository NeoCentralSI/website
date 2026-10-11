import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { TransferManagementPanel } from "@/components/kelola/TransferManagementPanel";

// Guidance revival: only the supervisor-transfer tab is restored. "Permintaan Pergantian"
// (TA-05) is not restored (GUIDANCE_REVIVAL_PLAN e1), and the baseline path
// /kelola/tugas-akhir/kadep/pembimbing now belongs to DSSKadep.
const TAB_ITEMS: TabItem[] = [
  { label: "Kelola Pembimbing", to: "/kelola/tugas-akhir/kadep/pergantian-pembimbing" },
];

const PLACEHOLDER_COPY: Record<string, string> = {
  "Kelola Pembimbing": "Kelola dan setujui pengajuan pembimbing tugas akhir.",
};

export default function KelolaTugasAkhirKadep() {
  const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();
  const location = useLocation();

  const activeTab = useMemo(() => {
    return TAB_ITEMS.find((tab) => location.pathname.startsWith(tab.to)) || TAB_ITEMS[0];
  }, [location.pathname]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Kelola" },
      { label: "Tugas Akhir", href: "/kelola/tugas-akhir/kadep/pergantian-pembimbing" },
      { label: activeTab.label },
    ],
    [activeTab.label]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(activeTab.label);
  }, [activeTab.label, breadcrumbs, setBreadcrumbs, setTitle]);

  const renderContent = () => {
    if (activeTab.label === "Kelola Pembimbing") {
      return <TransferManagementPanel />;
    }

    const copy = PLACEHOLDER_COPY[activeTab.label] || "";

    return (
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{activeTab.label}</h2>
        <p className="text-sm text-muted-foreground mt-1">{copy}</p>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Tugas Akhir</h1>
        <p className="text-muted-foreground">Kelola pergantian pembimbing tugas akhir mahasiswa</p>
      </div>

      <TabsNav tabs={TAB_ITEMS} />
      {renderContent()}
    </div>
  );
}
