import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { TemplateManagementPanel } from "@/components/milestone/TemplateManagementPanel";
import { TopicManagementPanel } from "@/components/kelola/TopicManagementPanel";
import { DataMasterTaPanel } from "@/components/kelola/DataMasterTaPanel";
import { CpmkManagementPanel } from "@/components/kelola/cpmk/CpmkManagementPanel";import { RubricSeminarManagementPanel } from '@/components/kelola/rubric-seminar/RubricSeminarManagementPanel';
const TAB_ITEMS: TabItem[] = [
  { label: "Kelola Topik", to: "/kelola/tugas-akhir/topik" },
  { label: "Kelola Milestone", to: "/kelola/tugas-akhir/milestone" },
  { label: "Kelola CPMK", to: "/kelola/tugas-akhir/cpmk" },
  { label: "Kelola Rubrik Seminar", to: "/kelola/tugas-akhir/rubrik-seminar" },
  { label: "Kelola Rubrik Sidang", to: "/kelola/tugas-akhir/rubrik-sidang" },
  { label: "Data Master Tugas Akhir", to: "/kelola/tugas-akhir/master-data" },
];

const PLACEHOLDER_COPY: Record<string, string> = {
  "Kelola Topik": "Kelola daftar topik tugas akhir untuk mengelompokkan template milestone.",
  "Kelola Milestone": "Kelola daftar milestone tugas akhir, termasuk pembuatan dan pembaruan jadwal.",
  "Kelola Rubrik Seminar": "Atur rubrik penilaian untuk seminar tugas akhir di sini.",
  "Kelola Rubrik Sidang": "Atur rubrik penilaian untuk sidang tugas akhir di sini.",
};

export default function KelolaTugasAkhirPage() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const activeTab =
    TAB_ITEMS.find((tab) => pathname.startsWith(tab.to)) || TAB_ITEMS[0];
  const copy = PLACEHOLDER_COPY[activeTab.label] ?? "Konten akan segera hadir.";

  const breadcrumbs = useMemo(
    () => [{ label: "Kelola", href: "/kelola" }, { label: "Tugas Akhir", href: "/kelola/tugas-akhir" }, { label: activeTab.label }],
    [activeTab.label]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(activeTab.label);
  }, [activeTab.label, breadcrumbs, setBreadcrumbs, setTitle]);

  const renderContent = () => {
    if (activeTab.label === "Kelola Topik") {
      return <TopicManagementPanel />;
    }

    if (activeTab.label === "Kelola Milestone") {
      return <TemplateManagementPanel />;
    }

    if (activeTab.label === "Data Master Tugas Akhir") {
      return <DataMasterTaPanel />;
    }

    if (activeTab.label === "Kelola CPMK") {
      return <CpmkManagementPanel />;
    }

    if (activeTab.label === "Kelola Rubrik Seminar") {
      return <RubricSeminarManagementPanel />;
    }

    return (
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{activeTab.label}</h2>
        <p className="text-sm text-muted-foreground mt-1">{copy}</p>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Tugas Akhir</h1>
          <p className="text-gray-500">Manajemen topik, milestone, dan rubrik penilaian</p>
        </div>
      </div>

      <TabsNav tabs={TAB_ITEMS} />
      {renderContent()}
    </div>
  );
}
