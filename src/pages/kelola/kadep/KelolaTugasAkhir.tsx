import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { ThesisManagementPanel } from "@/components/kelola/ThesisManagementPanel";
import { ChangeRequestManagementPanel } from "@/components/kelola/ChangeRequestManagementPanel";

const TAB_ITEMS: TabItem[] = [
  { label: "Permintaan Pergantian", to: "/kelola/tugas-akhir/kadep/pergantian" },
  { label: "Kelola Data TA", to: "/kelola/tugas-akhir/kadep/data" },
  { label: "Kelola Penguji", to: "/kelola/tugas-akhir/kadep/penguji" },
  { label: "Kelola Pembimbing", to: "/kelola/tugas-akhir/kadep/pembimbing" },
  { label: "ACC Rubrik", to: "/kelola/tugas-akhir/kadep/acc-rubrik" },
];

const PLACEHOLDER_COPY: Record<string, string> = {
  "Permintaan Pergantian": "Kelola permintaan pergantian topik atau pembimbing dari mahasiswa.",
  "Kelola Data TA": "Kelola data tugas akhir mahasiswa, termasuk pembatalan/reset TA.",
  "Kelola Penguji": "Kelola penugasan dosen penguji untuk sidang tugas akhir.",
  "Kelola Pembimbing": "Kelola dan setujui pengajuan pembimbing tugas akhir.",
  "ACC Rubrik": "Tinjau dan setujui rubrik penilaian seminar dan sidang.",
};

export default function KelolaTugasAkhirKadep() {
  const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();
  const location = useLocation();

  const activeTab = useMemo(() => {
    return TAB_ITEMS.find((tab) => location.pathname.startsWith(tab.to)) || TAB_ITEMS[0];
  }, [location.pathname]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Kelola", href: "/kelola" },
      { label: "Tugas Akhir", href: "/kelola/tugas-akhir/kadep" },
      { label: activeTab.label },
    ],
    [activeTab.label]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(activeTab.label);
  }, [activeTab.label, breadcrumbs, setBreadcrumbs, setTitle]);

  const renderContent = () => {
    if (activeTab.label === "Permintaan Pergantian") {
      return <ChangeRequestManagementPanel />;
    }

    if (activeTab.label === "Kelola Data TA") {
      return <ThesisManagementPanel />;
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
    <div className="p-4 space-y-4">
      <TabsNav tabs={TAB_ITEMS} />
      {renderContent()}
    </div>
  );
}
