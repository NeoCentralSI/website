import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Supervisor2KadepSection } from '@/components/bimbingan/Supervisor2KadepSection';
import { PageHeading } from '@/components/shared/PageHeading';
import { KadepSupervisorAssignmentPanel } from '@/components/thesis-proposal/KadepSupervisorAssignmentPanel';
import { KadepSupervisorRequestQueue } from '@/components/thesis-proposal/KadepSupervisorRequestQueue';
import { SupervisionQuotaPanel } from '@/components/thesis-proposal/SupervisionQuotaPanel';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useRole } from '@/hooks/shared/useRole';
import { useSupervisorAssignmentOverview } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import { useKadepSupervisorQueue } from '@/hooks/thesis-proposal/useSupervisorRequests';

const TABS = [
  { value: 'penetapan', label: 'Penetapan Semester Ini', kadepOnly: false },
  { value: 'departemen', label: 'Pengajuan Lewat Departemen', kadepOnly: true },
  { value: 'atas-kuota', label: 'Pengajuan di Atas Kuota', kadepOnly: true },
  { value: 'pembimbing-2', label: 'Permintaan Pembimbing 2', kadepOnly: true },
  { value: 'beban-dosen', label: 'Beban Dosen', kadepOnly: false },
] as const;
type TabValue = (typeof TABS)[number]['value'];
const DEFAULT_TAB: TabValue = 'penetapan';

/**
 * Tugas Akhir > Penetapan (rencana bagian 6; Paket P8: judul halaman "Penetapan Pembimbing" di
 * luar kartu, tab di tingkat halaman, isi tiap tab berupa tabel). Ketua Departemen memutus
 * pengajuan dan menerbitkan penetapan per periode; Sekretaris Departemen hanya melihat penetapan
 * dan beban dosen.
 */
export default function KadepThesisSupervisorAssignment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isKadep, isAdmin } = useRole();
  const kadep = isKadep();
  const [searchParams, setSearchParams] = useSearchParams();
  const visible = TABS.filter((t) => kadep || !t.kadepOnly);
  const requested = searchParams.get('tab');
  const tab: TabValue = visible.some((t) => t.value === requested) ? (requested as TabValue) : DEFAULT_TAB;
  const { data } = useKadepSupervisorQueue(kadep);
  const { data: assignment } = useSupervisorAssignmentOverview();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir' }, { label: 'Penetapan Pembimbing' }]);
    setTitle('Penetapan Pembimbing');
  }, [setBreadcrumbs, setTitle]);

  const badges: Partial<Record<TabValue, number>> = {
    penetapan: assignment?.needsIssue ? assignment.newCount : undefined,
    departemen: data?.department.length,
    'atas-kuota': data?.overQuota.length,
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Penetapan Pembimbing"
        subtitle={kadep
          ? 'Keputusan pengajuan pembimbing lewat departemen dan di atas kuota, serta penerbitan Penetapan Pembimbing per semester'
          : 'Penetapan Pembimbing semester berjalan dan beban bimbingan dosen'}
      />
      <LocalTabsNav
        tabs={visible.map((t) => ({ value: t.value, label: t.label, badge: badges[t.value] }))}
        activeTab={tab}
        onTabChange={(value) => setSearchParams(value === DEFAULT_TAB ? {} : { tab: value }, { replace: true })}
      />
      {tab === 'penetapan' && <KadepSupervisorAssignmentPanel canIssue={kadep} isKadepOrAdmin={kadep || isAdmin()} />}
      {tab === 'departemen' && <KadepSupervisorRequestQueue route="department" />}
      {tab === 'atas-kuota' && <KadepSupervisorRequestQueue route="over_quota" />}
      {tab === 'pembimbing-2' && <Supervisor2KadepSection />}
      {tab === 'beban-dosen' && <SupervisionQuotaPanel canEdit={false} showLimits={false} />}
    </div>
  );
}
