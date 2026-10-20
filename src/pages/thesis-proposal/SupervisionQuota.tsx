import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { PageHeading } from '@/components/shared/PageHeading';
import { SupervisionLimitToolbar } from '@/components/thesis-proposal/SupervisionLimitControls';
import { SupervisionLoadCharts } from '@/components/thesis-proposal/SupervisionLoadCharts';
import { SupervisionLoadTable } from '@/components/thesis-proposal/SupervisionLoadTable';
import { Spinner } from '@/components/ui/spinner';
import { useSupervisionLoadOverview } from '@/hooks/thesis-proposal/useSupervisionQuota';

/**
 * Kelola > Batas Bimbingan: Ketua dan Sekretaris Departemen. Halaman ini
 * mengelola batas umum; batas per semester ada di Penetapan → Beban Dosen. Tiga grafik, lalu
 * tabel Beban Dosen dengan batas umum di toolbarnya.
 */
export default function SupervisionQuotaPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const overview = useSupervisionLoadOverview();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Kelola' }, { label: 'Batas Bimbingan' }]);
    setTitle('Batas Bimbingan');
  }, [setBreadcrumbs, setTitle]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Batas Bimbingan" subtitle="Batas umum dan beban bimbingan dosen" />
      <SupervisionLoadCharts lecturers={overview.data?.lecturers} isLoading={overview.isLoading} />
      {overview.isLoading && !overview.data ? (
        <div className="flex justify-center py-10"><Spinner className="h-6 w-6" /></div>
      ) : overview.error || !overview.data ? (
        <p className="text-sm text-destructive">{overview.error instanceof Error ? overview.error.message : 'Gagal memuat batas bimbingan.'}</p>
      ) : (
        <SupervisionLoadTable
          overview={overview.data}
          isFetching={overview.isFetching}
          onRefresh={() => void overview.refetch()}
          toolbar={<SupervisionLimitToolbar overview={overview.data} scope="general" canEdit />}
        />
      )}
    </div>
  );
}
