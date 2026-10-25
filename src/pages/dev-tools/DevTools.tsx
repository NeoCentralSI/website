/**
 * DEV TOOLS PAGE — Admin-only development utilities for testing scenarios.
 * ⚠️ DELETE THIS DIRECTORY (pages/dev-tools/) and components/dev-tools/ when dev tools
 * are no longer needed.
 */
import { useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { SoftWarning } from '@/components/shared/SoftWarning';

import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import {
  DevToolsEventTablePanel,
  DevToolsYudisiumParticipantTablePanel,
  DevToolsYudisiumPeriodTablePanel,
} from '@/components/dev-tools/DevToolsFinalStagesTables';
import { DevToolsGuidancePanel } from '@/components/dev-tools/DevToolsGuidancePanel';
import { DevToolsPeriodPanel } from '@/components/dev-tools/DevToolsPeriodPanel';
import { DevToolsProposalPanel } from '@/components/dev-tools/DevToolsProposalPanel';
import { DevToolsStudentPanel } from '@/components/dev-tools/DevToolsStudentPanel';
import { DevToolsUserPanel } from '@/components/dev-tools/DevToolsUserPanel';

const DEV_TOOLS_BASE_PATH = '/admin/dev-tools';

const TABS = [
  { label: 'User', to: `${DEV_TOOLS_BASE_PATH}/users`, Panel: DevToolsUserPanel },
  { label: 'Mahasiswa', to: `${DEV_TOOLS_BASE_PATH}/mahasiswa`, Panel: DevToolsStudentPanel },
  { label: 'Periode', to: `${DEV_TOOLS_BASE_PATH}/periode`, Panel: DevToolsPeriodPanel },
  { label: 'Proposal', to: `${DEV_TOOLS_BASE_PATH}/proposal`, Panel: DevToolsProposalPanel },
  { label: 'Bimbingan', to: `${DEV_TOOLS_BASE_PATH}/bimbingan`, Panel: DevToolsGuidancePanel },
  { label: 'Seminar Hasil', to: `${DEV_TOOLS_BASE_PATH}/seminar`, Panel: () => <DevToolsEventTablePanel kind="seminars" /> },
  { label: 'Sidang', to: `${DEV_TOOLS_BASE_PATH}/sidang`, Panel: () => <DevToolsEventTablePanel kind="defences" /> },
  { label: 'Periode Yudisium', to: `${DEV_TOOLS_BASE_PATH}/periode-yudisium`, Panel: DevToolsYudisiumPeriodTablePanel },
  { label: 'Peserta Yudisium', to: `${DEV_TOOLS_BASE_PATH}/peserta-yudisium`, Panel: DevToolsYudisiumParticipantTablePanel },
] as const;

// Exact paths: "/periode" must not light up on "/periode-yudisium".
const TAB_ITEMS: TabItem[] = TABS.map(({ label, to }) => ({ label, to, end: true }));

/** The tab of a path, matched per whole segment. */
export const devToolsTabOf = (pathname: string) =>
  TABS.find((tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`)) ?? TABS[0];

export default function DevTools() {
  const { pathname } = useLocation();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const activeTab = devToolsTabOf(pathname);
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

      <SoftWarning title="Development Tools — Hanya untuk Pengembangan">
        Fitur ini mengubah data secara langsung di database. Gunakan hanya untuk menguji skenario, bukan untuk data operasional.
      </SoftWarning>

      <div>
        <TabsNav tabs={TAB_ITEMS} />
        <Panel />
      </div>
    </div>
  );
}
