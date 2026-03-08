import { useEffect, useMemo } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import { ExitSurveyManagementPanel } from "@/components/yudisium/exit-survey/ExitSurveyManagementPanel";
import { YudisiumRequirementManagementPanel } from "@/components/yudisium/requirements/YudisiumRequirementManagementPanel";
import { YudisiumTable } from "@/components/yudisium/event/YudisiumTable";
import { useYudisiumEvents } from "@/hooks/master-data/useYudisiumEvents";
import { useRole } from "@/hooks/shared";
import { ROLES } from "@/lib/roles";

const TAB_ITEMS: TabItem[] = [
  { label: "Yudisium", to: "/yudisium/lecturer/event" },
  { label: "Persyaratan Yudisium", to: "/yudisium/lecturer/persyaratan" },
  { label: "Exit Survey", to: "/yudisium/lecturer/exit-survey" },
];

function PersyaratanYudisiumPanel() {
  return <YudisiumRequirementManagementPanel />;
}


export default function LecturerYudisiumPage() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { hasAnyRole } = useRole();

  const canManageYudisiumMaster = hasAnyRole([
    ROLES.SEKRETARIS_DEPARTEMEN,
    ROLES.KOORDINATOR_YUDISIUM,
  ]);

  const visibleTabs = useMemo<TabItem[]>(
    () =>
      canManageYudisiumMaster
        ? TAB_ITEMS
        : [],
    [canManageYudisiumMaster]
  );

  const activeTab =
    visibleTabs.find((tab) => pathname.startsWith(tab.to)) ?? visibleTabs[0] ?? TAB_ITEMS[0];

  const breadcrumbs = useMemo(
    () =>
      canManageYudisiumMaster
        ? [{ label: "Yudisium", href: "/yudisium" }, { label: activeTab.label }]
        : [{ label: "Yudisium" }],
    [activeTab.label, canManageYudisiumMaster]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(canManageYudisiumMaster ? activeTab.label : "Yudisium");
  }, [activeTab.label, breadcrumbs, canManageYudisiumMaster, setBreadcrumbs, setTitle]);

  const {
    events,
    isLoading,
    isFetching,
    refetch,
    create,
    update,
    remove,
    isDeleting,
  } = useYudisiumEvents();

  const renderContent = () => {
    if (activeTab.label === "Persyaratan Yudisium") return <PersyaratanYudisiumPanel />;
    if (activeTab.label === "Exit Survey") return <ExitSurveyManagementPanel />;
    return (
      <YudisiumTable
        data={events}
        isLoading={isLoading}
        isFetching={isFetching}
        onDelete={remove}
        onUpdate={update}
        onCreate={create}
        onRefresh={refetch}
        isDeleting={isDeleting}
        canManage={canManageYudisiumMaster}
      />
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {canManageYudisiumMaster ? "Kelola Data Yudisium" : "Data Yudisium"}
          </h1>
          <p className="text-gray-500">
            {canManageYudisiumMaster
              ? "Kelola acara yudisium, persyaratan, dan exit survey"
              : "Data seluruh periode yudisium"}
          </p>
        </div>
      </div>

      {visibleTabs.length > 0 && <TabsNav tabs={visibleTabs} />}
      {renderContent()}
    </div>
  );
}
