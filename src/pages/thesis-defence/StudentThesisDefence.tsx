import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { StudentThesisDefenceOverviewPanel } from '@/components/thesis-defence/StudentThesisDefenceOverviewPanel';
import {
  useStudentDefenceOverview,
  useStudentDefenceHistory,
} from '@/hooks/thesis-defence';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const { data: overview, isLoading: isOverviewLoading } = useStudentDefenceOverview();
  const { data: history, isLoading: isHistoryLoading } = useStudentDefenceHistory();

  const isLoading = isOverviewLoading || isHistoryLoading;

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang Tugas Akhir', href: '/tugas-akhir/sidang' },
      { label: 'Status & Pendaftaran' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Sidang Tugas Akhir');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-[350px]" />
          <Skeleton className="lg:col-span-7 h-[350px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-2xl font-bold">Sidang Tugas Akhir</h1>
          <p className="text-gray-500">
            Pantau status sidang, unggah dokumen pendaftaran, dan lihat riwayat sidang
          </p>
        </div>
      </div>

      {overview ? (
        <StudentThesisDefenceOverviewPanel
          overview={overview}
          history={history || []}
          onDetailClick={(id) => navigate(`/tugas-akhir/sidang/${id}`)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Data sidang tugas akhir belum tersedia.
        </div>
      )}
    </div>
  );
}
