import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { ExitSurveyManagementPanel } from "@/components/kelola/exit-survey/ExitSurveyManagementPanel";
import { YudisiumRequirementManagementPanel } from "@/components/yudisium/requirements/YudisiumRequirementManagementPanel";

const TAB_ITEMS: TabItem[] = [
  { label: "Yudisium", to: "/kelola/yudisium/event" },
  { label: "Persyaratan Yudisium", to: "/kelola/yudisium/persyaratan" },
  { label: "Exit Survey", to: "/kelola/yudisium/exit-survey" },
];

function YudisiumPanel() {
  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Yudisium</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Kelola acara yudisium, jadwal pendaftaran, dan peserta. Konten akan segera hadir.
      </p>
    </div>
  );
}

function PersyaratanYudisiumPanel() {
  return <YudisiumRequirementManagementPanel />;
}


export default function KelolaYudisiumPage() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const activeTab =
    TAB_ITEMS.find((tab) => pathname.startsWith(tab.to)) ?? TAB_ITEMS[0];

  const breadcrumbs = useMemo(
    () => [
      { label: "Kelola", href: "/kelola" },
      { label: "Yudisium", href: "/kelola/yudisium" },
      { label: activeTab.label },
    ],
    [activeTab.label]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(activeTab.label);
  }, [activeTab.label, breadcrumbs, setBreadcrumbs, setTitle]);

  const renderContent = () => {
    if (activeTab.label === "Yudisium") return <YudisiumPanel />;
    if (activeTab.label === "Persyaratan Yudisium") return <PersyaratanYudisiumPanel />;
    if (activeTab.label === "Exit Survey") return <ExitSurveyManagementPanel />;
    return <YudisiumPanel />;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Yudisium</h1>
          <p className="text-gray-500">
            Manajemen acara yudisium, persyaratan, dan exit survey
          </p>
        </div>
      </div>

      <TabsNav tabs={TAB_ITEMS} />
      {renderContent()}
    </div>
  );
}
