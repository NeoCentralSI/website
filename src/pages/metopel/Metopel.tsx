import { useEffect, useMemo } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { useStudentEligibility } from "@/hooks/shared/useStudentEligibility";
import { isMetopenArchiveMode } from "@/lib/metopelArchive";
import { MetopelOverviewTab } from "./MetopelOverviewTab";
import CariPembimbing from "./CariPembimbing";
import { MetopenProposalTab } from "./MetopenProposalTab";
import { MetopenInformalLogbookTab } from "./MetopenInformalLogbookTab";
import { Info } from "lucide-react";

const BASE_TAB_ITEMS: TabItem[] = [{ label: "Overview", to: "/metopel", end: true }];
const SEARCH_TAB: TabItem = { label: "Cari Pembimbing", to: "/metopel/cari-pembimbing" };
const PROPOSAL_TAB: TabItem = { label: "Proposal", to: "/metopel/proposal" };
const LOGBOOK_TAB: TabItem = { label: "Catatan informal", to: "/metopel/logbook" };

export default function Metopel() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const location = useLocation();
  const { isStudent } = useRole();
  const isStudentUser = isStudent();
  const { data: advisorAccess } = useAdvisorAccessState(isStudentUser);
  const { isMetopenOnlyTrack } = useStudentEligibility();
  const isArchiveMode = isMetopenArchiveMode({
    isMetopenArchive: advisorAccess?.isMetopenArchive,
    hasTakenMetopen: advisorAccess?.hasTakenMetopen,
    takingThesisCourse: advisorAccess?.takingThesisCourse,
    metopenReadOnly: advisorAccess?.metopenReadOnly,
    requestStatus: advisorAccess?.requestStatus,
    latestRequestStatus: advisorAccess?.latestRequest?.status,
  });

  const showMetopenProposalTab =
    isStudentUser &&
    isMetopenOnlyTrack &&
    (Boolean(advisorAccess?.hasBookedSupervisor) || Boolean(advisorAccess?.hasOfficialSupervisor) || isArchiveMode);
  const showMetopenInformalLogbookTab =
    isStudentUser &&
    isMetopenOnlyTrack &&
    (Boolean(advisorAccess?.hasOfficialSupervisor) || isArchiveMode);

  const tabs = useMemo(() => {
    const items = [...BASE_TAB_ITEMS];
    if (showMetopenProposalTab) {
      items.push(PROPOSAL_TAB);
    }
    if (showMetopenInformalLogbookTab) {
      items.push(LOGBOOK_TAB);
    }
    const canOpenAdvisorSearchTab =
      Boolean(advisorAccess?.canBrowseCatalog) || Boolean(advisorAccess?.hasBlockingRequest);

    if (!isArchiveMode && !(advisorAccess?.hasOfficialSupervisor ?? false) && canOpenAdvisorSearchTab) {
      items.push(SEARCH_TAB);
    }

    return items;
  }, [
    advisorAccess?.canBrowseCatalog,
    advisorAccess?.hasBlockingRequest,
    advisorAccess?.hasOfficialSupervisor,
    isArchiveMode,
    showMetopenProposalTab,
    showMetopenInformalLogbookTab,
  ]);

  const activeTabKey = useMemo(() => {
    if (location.pathname.startsWith("/metopel/cari-pembimbing")) return "search";
    if (location.pathname.startsWith("/metopel/proposal")) return "proposal";
    if (location.pathname.startsWith("/metopel/logbook")) return "logbook";
    return "overview";
  }, [location.pathname]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Metodologi Penelitian" }]);
    setTitle("Metodologi Penelitian");
  }, [setBreadcrumbs, setTitle]);

  const renderContent = () => {
    switch (activeTabKey) {
      case "search":
        return <CariPembimbing readOnly={isArchiveMode} advisorAccess={advisorAccess} />;
      case "proposal":
        return <MetopenProposalTab readOnly={isArchiveMode} />;
      case "logbook":
        return <MetopenInformalLogbookTab readOnly={isArchiveMode} />;
      default:
        return <MetopelOverviewTab readOnly={isArchiveMode} advisorAccess={advisorAccess} />;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {isArchiveMode && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Halaman ini ditampilkan sebagai <strong>arsip</strong> (hanya lihat).
          </p>
        </div>
      )}

      <div>
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">Metodologi Penelitian</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {isArchiveMode
            ? "Ringkasan arsip fase Metode Penelitian sebelum Anda masuk ke proses Tugas Akhir."
            : "Kelola pengajuan pembimbing, judul awal, penilaian proposal, dan status pengesahan judul pada fase Metode Penelitian."}
        </p>
      </div>

      <TabsNav tabs={tabs} />

      <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </div>
  );
}
