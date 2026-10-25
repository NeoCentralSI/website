/**
 * DEV TOOLS PAGE — Admin-only development utilities for testing scenarios.
 * ⚠️ DELETE THIS DIRECTORY (pages/dev-tools/) and components/dev-tools/ when dev tools
 * are no longer needed.
 */
import { useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { DevToolsFinalStagesPanel } from '@/components/dev-tools/DevToolsFinalStagesPanel';
import { DevToolsGuidancePanel } from '@/components/dev-tools/DevToolsGuidancePanel';
import { DevToolsPeriodPanel } from '@/components/dev-tools/DevToolsPeriodPanel';
import { DevToolsProposalPanel } from '@/components/dev-tools/DevToolsProposalPanel';
import { DevToolsStudentPanel } from '@/components/dev-tools/DevToolsStudentPanel';
import { DevToolsUserPanel } from '@/components/dev-tools/DevToolsUserPanel';
import { DevToolsYudisiumParticipantPanel } from '@/components/dev-tools/DevToolsYudisiumParticipantPanel';
import { DevToolsYudisiumPeriodPanel } from '@/components/dev-tools/DevToolsYudisiumPeriodPanel';

const DEV_TOOLS_BASE_PATH = '/admin/dev-tools';

const TABS = [
  { label: 'User', to: `${DEV_TOOLS_BASE_PATH}/users`, Panel: DevToolsUserPanel },
  { label: 'Mahasiswa', to: `${DEV_TOOLS_BASE_PATH}/mahasiswa`, Panel: DevToolsStudentPanel },
  { label: 'Periode', to: `${DEV_TOOLS_BASE_PATH}/periode`, Panel: DevToolsPeriodPanel },
  { label: 'Proposal', to: `${DEV_TOOLS_BASE_PATH}/proposal`, Panel: DevToolsProposalPanel },
  { label: 'Bimbingan', to: `${DEV_TOOLS_BASE_PATH}/bimbingan`, Panel: DevToolsGuidancePanel },
  { label: 'Seminar & Sidang', to: `${DEV_TOOLS_BASE_PATH}/seminar-sidang`, Panel: DevToolsFinalStagesPanel },
  { label: 'Periode Yudisium', to: `${DEV_TOOLS_BASE_PATH}/periode-yudisium`, Panel: DevToolsYudisiumPeriodPanel },
  { label: 'Peserta Yudisium', to: `${DEV_TOOLS_BASE_PATH}/peserta-yudisium`, Panel: DevToolsYudisiumParticipantPanel },
] as const;

const TAB_ITEMS: TabItem[] = TABS.map(({ label, to }) => ({ label, to }));

export default function DevTools() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const activeTab = TABS.find((tab) => pathname.startsWith(tab.to)) ?? TABS[0];
  const breadcrumbs = useMemo(
    () => [{ label: 'Development Tools', href: TABS[0].to }, { label: activeTab.label }],
    [activeTab.label],
  );
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Development Tools');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const Panel = activeTab.Panel;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Development Tools</h1>
        <p className="text-muted-foreground">
          Alat bantu pengujian: user, mahasiswa, periode, bimbingan, seminar, sidang, dan yudisium
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Development Tools — Hanya untuk Pengembangan</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Fitur ini mengubah data secara langsung di database. Gunakan hanya untuk menguji skenario, bukan untuk data operasional.</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <TabsNav tabs={TAB_ITEMS} />
        <Panel />
      </div>
    </div>
  );
}
