import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { TopicManagementPanel } from "@/components/kelola/TopicManagementPanel";
import { DataMasterTaPanel } from "@/components/kelola/DataMasterTaPanel";
import { ThesisCpmkManagementPanel as CpmkManagementPanel } from "@/components/master-data/thesis-cpmk/ThesisCpmkManagementPanel";
import { SeminarRubricManagementPanel as RubricSeminarManagementPanel } from '@/components/master-data/seminar-rubric/SeminarRubricManagementPanel';
import { DefenceRubricManagementPanel as RubricDefenceManagementPanel } from '@/components/master-data/defence-rubric/DefenceRubricManagementPanel';
import { SeminarRequirementManagementPanel } from "@/components/master-data/seminar-requirement/SeminarRequirementManagementPanel";
import { DefenceRequirementManagementPanel } from "@/components/master-data/defence-requirement/DefenceRequirementManagementPanel";
import { useRole } from "@/hooks/shared";

/** Master TA penuh (seminar/sidang). CPMK+rubrik Metopen ada di /kelola/metopen/cpmk-rubrik. */
const TAB_ITEMS: TabItem[] = [
  { label: "Topik", to: "/kelola/tugas-akhir/topik" },
  { label: "Data Master Tugas Akhir", to: "/kelola/tugas-akhir/master-data" },
  { label: "CPMK", to: "/kelola/tugas-akhir/cpmk" },
  { label: "Rubrik Seminar", to: "/kelola/tugas-akhir/rubrik-seminar" },
  { label: "Rubrik Sidang", to: "/kelola/tugas-akhir/rubrik-sidang" },
  { label: "Syarat Seminar", to: "/kelola/tugas-akhir/syarat-seminar" },
  { label: "Syarat Sidang", to: "/kelola/tugas-akhir/syarat-sidang" }
];

const PLACEHOLDER_COPY: Record<string, string> = {
  "Topik": "Kelola daftar topik tugas akhir untuk klasifikasi judul dan rekomendasi dosen pembimbing.",
  "Rubrik Seminar": "Atur rubrik penilaian untuk seminar tugas akhir di sini.",
  "Rubrik Sidang": "Atur rubrik penilaian untuk sidang tugas akhir di sini.",
  "Syarat Seminar": "Kelola persyaratan dokumen untuk pendaftaran Seminar Hasil.",
  "Syarat Sidang": "Kelola persyaratan dokumen untuk pendaftaran Sidang Tugas Akhir.",
};

export default function KelolaTugasAkhirPage() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep } = useRole();
  const isMasterDataOnly = isKadep();

  const activeTab =
    TAB_ITEMS.find((tab) => pathname.startsWith(tab.to)) || TAB_ITEMS[0];
  const copy = PLACEHOLDER_COPY[activeTab.label] ?? "Konten akan segera hadir.";

  const breadcrumbs = useMemo(
    () => isMasterDataOnly
      ? [{ label: "Tugas Akhir" }]
      : [{ label: "Tugas Akhir", href: "/kelola/tugas-akhir/topik" }, { label: activeTab.label }],
    [activeTab.label, isMasterDataOnly]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(isMasterDataOnly ? "Data Master Tugas Akhir" : activeTab.label);
  }, [activeTab.label, breadcrumbs, isMasterDataOnly, setBreadcrumbs, setTitle]);

  if (isMasterDataOnly) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Master Tugas Akhir</h1>
          <p className="text-muted-foreground">
            Kelola data master tugas akhir, mahasiswa, topik, dan pembimbing
          </p>
        </div>
        <DataMasterTaPanel />
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab.label === "Topik") {
      return <TopicManagementPanel />;
    }

    if (activeTab.label === "Data Master Tugas Akhir") {
      return <DataMasterTaPanel />;
    }

    if (activeTab.label === "CPMK") {
      return <CpmkManagementPanel />;
    }

    if (activeTab.label === "Rubrik Seminar") {
      return <RubricSeminarManagementPanel />;
    }

    if (activeTab.label === "Rubrik Sidang") {
      return <RubricDefenceManagementPanel />;
    }

    if (activeTab.label === "Syarat Seminar") {
      return <SeminarRequirementManagementPanel />;
    }

    if (activeTab.label === "Syarat Sidang") {
      return <DefenceRequirementManagementPanel />;
    }

    return (
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{activeTab.label}</h2>
        <p className="text-sm text-muted-foreground mt-1">{copy}</p>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Tugas Akhir</h1>
          <p className="text-muted-foreground">
            Manajemen topik, CPMK seminar/sidang, rubrik seminar/sidang, dan data master tugas akhir
          </p>
        </div>
      </div>

      <TabsNav tabs={TAB_ITEMS} />
      {renderContent()}
    </div>
  );
}
