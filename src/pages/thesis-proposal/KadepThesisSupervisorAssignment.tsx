import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Supervisor2KadepSection } from '@/components/bimbingan/Supervisor2KadepSection';
import { KadepSupervisorRequestQueue } from '@/components/thesis-proposal/KadepSupervisorRequestQueue';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { useKadepSupervisorQueue } from '@/hooks/thesis-proposal/useSupervisorRequests';

const TABS = [
  { value: 'departemen', label: 'Pengajuan Lewat Departemen' },
  { value: 'atas-kuota', label: 'Pengajuan di Atas Kuota' },
  { value: 'pembimbing-2', label: 'Permintaan Pembimbing 2' },
] as const;
type TabValue = (typeof TABS)[number]['value'];

/**
 * Tugas Akhir > Penetapan Pembimbing (Ketua Departemen, rencana bagian 6). Tab Penetapan Semester
 * Ini dan Beban Dosen menyusul bersama Penetapan Pembimbing.
 */
export default function KadepThesisSupervisorAssignment() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab: TabValue = TABS.some((t) => t.value === requested) ? (requested as TabValue) : 'departemen';
  const { data } = useKadepSupervisorQueue();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Tugas Akhir' }, { label: 'Penetapan Pembimbing' }]);
    setTitle('Penetapan Pembimbing');
  }, [setBreadcrumbs, setTitle]);

  const badges: Partial<Record<TabValue, number>> = {
    departemen: data?.department.length,
    'atas-kuota': data?.overQuota.length,
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <LocalTabsNav
        tabs={TABS.map((t) => ({ value: t.value, label: t.label, badge: badges[t.value] }))}
        activeTab={tab}
        onTabChange={(value) => setSearchParams(value === 'departemen' ? {} : { tab: value }, { replace: true })}
      />
      {tab === 'departemen' && <KadepSupervisorRequestQueue route="department" />}
      {tab === 'atas-kuota' && <KadepSupervisorRequestQueue route="over_quota" />}
      {tab === 'pembimbing-2' && <Supervisor2KadepSection />}
    </div>
  );
}
