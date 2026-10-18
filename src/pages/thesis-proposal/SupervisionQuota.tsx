import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PageHeading } from '@/components/shared/PageHeading';
import { SupervisionQuotaPanel } from '@/components/thesis-proposal/SupervisionQuotaPanel';

/**
 * Kelola > Batas Bimbingan (K30): Ketua Departemen dan Sekretaris Departemen mengatur batas dan
 * melihat beban tiap dosen. Paket P8: Admin tidak lagi membuka halaman ini.
 */
export default function SupervisionQuotaPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Kelola' }, { label: 'Batas Bimbingan' }]);
    setTitle('Batas Bimbingan');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Batas Bimbingan" subtitle="Batas umum dan batas per periode jumlah mahasiswa bimbingan, beserta beban tiap dosen" />
      <SupervisionQuotaPanel canEdit />
    </div>
  );
}
